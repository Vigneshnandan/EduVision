-- Migration: Tighten schools and teachers table RLS and enforce tenant isolation

-- ============================================================================
-- 1. Ensure required columns on public.teachers and public.schools exist
-- ============================================================================
alter table public.teachers
    add column if not exists auth_user_id uuid references auth.users(id) on delete cascade,
    add column if not exists role text not null default 'teacher' check (role in ('teacher', 'school_admin')),
    add column if not exists is_active boolean not null default true;

alter table public.schools
    add column if not exists status text not null default 'trial'
        check (status in ('trial', 'active', 'suspended')),
    add column if not exists contact_email text,
    add column if not exists contact_phone text,
    add column if not exists onboarded_at timestamptz default now(),
    add column if not exists plan_tier text not null default 'free'
        check (plan_tier in ('free', 'paid')),
    add column if not exists plan_renews_at date,
    add column if not exists at_risk_threshold_pct int not null default 75;

-- Backfill auth_user_id from auth.users where possible
update public.teachers t
set auth_user_id = u.id
from auth.users u
where t.auth_user_id is null
  and (
      u.raw_user_meta_data->>'teacher_login_id' = t.teacher_login_id
      or lower(u.email) = lower(t.teacher_login_id)
      or lower(u.email) = lower(t.teacher_login_id || '@eduvision.local')
  );

-- ============================================================================
-- 2. Drop existing current_teacher_school_id() with CASCADE to reset return type
-- ============================================================================
drop function if exists public.current_teacher_school_id() cascade;

-- Recreate hardened current_teacher_school_id() returning text (handles both bigint & uuid)
create or replace function public.current_teacher_school_id()
returns text
language sql
security definer
stable
as $$
    select coalesce(
        (select school_id::text from public.teachers where auth_user_id = auth.uid() limit 1),
        nullif(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'school_id', '')::text,
        (select school_id::text from public.teachers where teacher_login_id = (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'teacher_login_id') and (auth_user_id is null or auth_user_id = auth.uid()) limit 1)
    );
$$;

-- ============================================================================
-- 3. Automatic trigger on auth.users after insert for reliable teacher linking
-- ============================================================================
create or replace function public.handle_new_teacher()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
    v_school_id public.teachers.school_id%type;
begin
    if new.raw_user_meta_data->>'teacher_login_id' is not null and new.raw_user_meta_data->>'school_id' is not null then
        select school_id into v_school_id
        from public.schools
        where school_id::text = new.raw_user_meta_data->>'school_id'
        limit 1;

        if v_school_id is not null then
            insert into public.teachers (school_id, teacher_name, teacher_login_id, auth_user_id)
            values (
                v_school_id,
                coalesce(new.raw_user_meta_data->>'teacher_name', 'Teacher'),
                new.raw_user_meta_data->>'teacher_login_id',
                new.id
            )
            on conflict (school_id, teacher_login_id) do update
            set auth_user_id = excluded.auth_user_id;
        end if;
    end if;
    return new;
exception when others then
    return new;
end;
$$;

drop trigger if exists on_auth_user_created_teacher on auth.users;
create trigger on_auth_user_created_teacher
    after insert on auth.users
    for each row execute function public.handle_new_teacher();

-- ============================================================================
-- 4. Scoped RLS policies on public.teachers
-- ============================================================================
drop policy if exists "Allow read for teachers" on public.teachers;
drop policy if exists "Allow insert for teachers registration" on public.teachers;
drop policy if exists "Teachers read same school roster" on public.teachers;
drop policy if exists "Teachers insert matching own auth session" on public.teachers;
drop policy if exists "School admins can manage teachers" on public.teachers;

-- Helper function to check if the current caller is an active school_admin
create or replace function public.is_school_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select coalesce(
        (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role') in ('school_admin', 'platform_admin'),
        false
    )
    or exists (
        select 1 from public.teachers
        where (auth_user_id = auth.uid() or teacher_login_id = (current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'teacher_login_id'))
          and role = 'school_admin'
          and is_active = true
    );
$$;

create policy "Teachers read same school roster" on public.teachers
    for select
    using (
        auth.role() = 'authenticated' and (
            school_id::text = public.current_teacher_school_id() or
            auth_user_id = auth.uid()
        )
    );

create policy "Teachers insert matching own auth session" on public.teachers
    for insert
    with check (
        auth.role() = 'authenticated' and (
            auth_user_id = auth.uid() or
            (school_id::text = public.current_teacher_school_id() and public.is_school_admin())
        )
    );

create policy "School admins can manage teachers" on public.teachers
    for all
    using (
        auth.role() = 'authenticated'
        and school_id::text = public.current_teacher_school_id()
        and public.is_school_admin()
    )
    with check (
        auth.role() = 'authenticated'
        and school_id::text = public.current_teacher_school_id()
        and public.is_school_admin()
    );

-- ============================================================================
-- 5. Scoped RLS policies on public.schools
-- ============================================================================
drop policy if exists "Public read for school directory" on public.schools;
drop policy if exists "Teachers update only their own school" on public.schools;

create policy "Public read for school directory" on public.schools
    for select
    using (
        (auth.role() = 'authenticated' and school_id::text = public.current_teacher_school_id())
        or (status in ('active', 'trial'))
    );

create policy "Teachers update only their own school" on public.schools
    for update
    using (
        auth.role() = 'authenticated' and school_id::text = public.current_teacher_school_id()
    )
    with check (
        auth.role() = 'authenticated' and school_id::text = public.current_teacher_school_id()
    );

-- Restrict anon from viewing commercial & sensitive columns
revoke select on public.schools from anon;
grant select (school_id, school_name, school_code, address) on public.schools to anon;
grant select on public.schools to authenticated;

-- ============================================================================
-- 6. Recreate tenant-isolation policies on attendance & student_details
-- ============================================================================
drop policy if exists "Teachers read attendance of their school" on public.attendance;
drop policy if exists "Teachers insert attendance for their school" on public.attendance;
drop policy if exists "Teachers update attendance for their school" on public.attendance;
drop policy if exists "Block attendance sync for suspended schools" on public.attendance;

create policy "Teachers read attendance of their school" on public.attendance
    for select
    using (
        auth.role() = 'authenticated' and school_id::text = public.current_teacher_school_id()
    );

create policy "Teachers insert attendance for their school" on public.attendance
    for insert
    with check (
        auth.role() = 'authenticated' and (school_id is null or school_id::text = public.current_teacher_school_id())
    );

create policy "Teachers update attendance for their school" on public.attendance
    for update
    using (
        auth.role() = 'authenticated' and school_id::text = public.current_teacher_school_id()
    )
    with check (
        auth.role() = 'authenticated' and school_id::text = public.current_teacher_school_id()
    );

create policy "Block attendance sync for suspended schools" on public.attendance
    as restrictive
    for insert
    with check (
        coalesce(
            (select status from public.schools where schools.school_id::text = attendance.school_id::text limit 1),
            'active'
        ) != 'suspended'
    );

drop policy if exists "Teachers read student details of their school" on public.student_details;
drop policy if exists "Teachers insert student details for their school" on public.student_details;
drop policy if exists "Teachers update student details for their school" on public.student_details;

create policy "Teachers read student details of their school" on public.student_details
    for select
    using (
        auth.role() = 'authenticated' and school_id::text = public.current_teacher_school_id()
    );

create policy "Teachers insert student details for their school" on public.student_details
    for insert
    with check (
        auth.role() = 'authenticated' and (school_id is null or school_id::text = public.current_teacher_school_id())
    );

create policy "Teachers update student details for their school" on public.student_details
    for update
    using (
        auth.role() = 'authenticated' and school_id::text = public.current_teacher_school_id()
    )
    with check (
        auth.role() = 'authenticated' and school_id::text = public.current_teacher_school_id()
    );

-- ============================================================================
-- 7. Classes & Academic Calendar policies (Phase 2 & MDM)
-- ============================================================================
do $$
begin
    if exists (select from pg_tables where schemaname = 'public' and tablename = 'classes') then
        drop policy if exists "School members can view their classes" on public.classes;
        drop policy if exists "School members can manage their classes" on public.classes;
        
        create policy "School members can view their classes" on public.classes
            for select using (school_id::text = public.current_teacher_school_id());
            
        create policy "School members can manage their classes" on public.classes
            for all using (school_id::text = public.current_teacher_school_id())
            with check (school_id::text = public.current_teacher_school_id());
    end if;

    if exists (select from pg_tables where schemaname = 'public' and tablename = 'school_holidays') then
        drop policy if exists "School members can view holidays" on public.school_holidays;
        drop policy if exists "School members can manage holidays" on public.school_holidays;
        
        create policy "School members can view holidays" on public.school_holidays
            for select using (school_id::text = public.current_teacher_school_id());
            
        create policy "School members can manage holidays" on public.school_holidays
            for all using (school_id::text = public.current_teacher_school_id())
            with check (school_id::text = public.current_teacher_school_id());
    end if;

    if exists (select from pg_tables where schemaname = 'public' and tablename = 'mdm_daily_registers') then
        drop policy if exists "Allow reads for same school" on public.mdm_daily_registers;
        drop policy if exists "Allow updates for same school" on public.mdm_daily_registers;
        drop policy if exists "Allow inserts for same school" on public.mdm_daily_registers;
        
        create policy "Allow reads for same school" on public.mdm_daily_registers
            for select using (school_id::text = public.current_teacher_school_id());
            
        create policy "Allow updates for same school" on public.mdm_daily_registers
            for update using (school_id::text = public.current_teacher_school_id());
            
        create policy "Allow inserts for same school" on public.mdm_daily_registers
            for insert with check (school_id::text = public.current_teacher_school_id());
    end if;
end $$;
