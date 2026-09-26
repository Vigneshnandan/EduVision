-- Migration: add a role column to teachers
alter table public.teachers
    add column if not exists role text not null default 'teacher'
        check (role in ('teacher', 'school_admin')),
    add column if not exists is_active boolean not null default true;

-- Migration: create platform_admins for the Admin Dashboard
create table if not exists public.platform_admins (
    admin_id uuid primary key default gen_random_uuid(),
    auth_user_id uuid not null references auth.users(id) on delete cascade,
    full_name text not null,
    created_at timestamptz default now()
);
alter table public.platform_admins enable row level security;
-- No public policy at all — this table is only ever read by server-side
-- code using the service_role key, which bypasses RLS by design.
