-- Migration: Phase 2 School Dashboard Schema (with bigint school_id and flexible class_teacher_id)
-- 1. Classes Table
create table if not exists public.classes (
    class_id uuid primary key default gen_random_uuid(),
    school_id bigint not null references public.schools(school_id) on delete cascade,
    class_name text not null,
    class_teacher_id text,
    created_at timestamptz default now(),
    unique(school_id, class_name)
);

alter table public.classes enable row level security;

-- Policies for classes
create policy "School members can view their classes" on public.classes
    for select using (school_id::text = public.current_teacher_school_id()::text);

create policy "School members can manage their classes" on public.classes
    for all using (school_id::text = public.current_teacher_school_id()::text)
    with check (school_id::text = public.current_teacher_school_id()::text);

-- 2. School Holidays (Academic Calendar) Table
create table if not exists public.school_holidays (
    holiday_id uuid primary key default gen_random_uuid(),
    school_id bigint not null references public.schools(school_id) on delete cascade,
    holiday_date date not null,
    label text not null,
    created_at timestamptz default now(),
    unique(school_id, holiday_date)
);

alter table public.school_holidays enable row level security;

-- Policies for school_holidays
create policy "School members can view holidays" on public.school_holidays
    for select using (school_id::text = public.current_teacher_school_id()::text);

create policy "School members can manage holidays" on public.school_holidays
    for all using (school_id::text = public.current_teacher_school_id()::text)
    with check (school_id::text = public.current_teacher_school_id()::text);

-- 3. Teachers management policy for school admins
create policy "School admins can manage teachers" on public.teachers
    for all
    using (
        auth.role() = 'authenticated'
        and school_id::text = public.current_teacher_school_id()::text
        and public.is_school_admin()
    )
    with check (
        auth.role() = 'authenticated'
        and school_id::text = public.current_teacher_school_id()::text
        and public.is_school_admin()
    );
