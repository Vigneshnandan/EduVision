-- Migration: Phase 4 Admin Dashboard School Management & Enforcement
-- 1. Add admin columns to public.schools
alter table public.schools
    add column if not exists status text not null default 'trial'
        check (status in ('trial', 'active', 'suspended')),
    add column if not exists contact_email text,
    add column if not exists contact_phone text,
    add column if not exists onboarded_at timestamptz default now();

-- 2. Enforcement: Restrictive RLS Policy to block attendance writes for suspended schools
drop policy if exists "Block attendance sync for suspended schools" on public.attendance;
create policy "Block attendance sync for suspended schools" on public.attendance
    as restrictive
    for insert
    with check (
        coalesce(
            (select status from public.schools where schools.school_id::text = attendance.school_id::text limit 1),
            'active'
        ) != 'suspended'
    );
