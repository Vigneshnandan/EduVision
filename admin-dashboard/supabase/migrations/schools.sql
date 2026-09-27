/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

create table if not exists public.schools (
    school_id bigint primary key generated always as identity, -- Matches live Supabase schema (bigint/int8)
    school_name text not null,
    school_code text unique,              -- optional short code for dropdown search
    address text,
    created_at timestamptz default now()
);

alter table public.schools enable row level security;

-- Drop legacy open policy
drop policy if exists "Public read for school directory" on public.schools;

-- Directory read: Authenticated teachers read their own school, or unauthenticated directory queries for active/trial schools
create policy "Public read for school directory" on public.schools
    for select
    using (
        (auth.role() = 'authenticated' and school_id::text = public.current_teacher_school_id()::text)
        or (status in ('active', 'trial'))
    );

-- Column-level privilege restriction: revoke wide select on schools from anon
-- and grant only non-sensitive directory fields needed for pre-login dropdown
revoke select on public.schools from anon;
grant select (school_id, school_name, school_code, address) on public.schools to anon;
grant select on public.schools to authenticated;
