/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

create table if not exists public.teachers (
    id bigint primary key generated always as identity,
    school_id bigint references public.schools(school_id) on delete cascade,
    teacher_name text not null,
    teacher_login_id text not null,
    auth_user_id uuid references auth.users(id) on delete cascade,
    role text not null default 'teacher' check (role in ('teacher', 'school_admin')),
    is_active boolean not null default true,
    created_at timestamptz default now(),
    unique(school_id, teacher_login_id)
);

alter table public.teachers enable row level security;

-- Drop legacy open policies
drop policy if exists "Allow read for teachers" on public.teachers;
drop policy if exists "Allow insert for teachers registration" on public.teachers;

-- Scoped read policy: Authenticated teachers of the same school or own user record
create policy "Teachers read same school roster" on public.teachers
    for select
    using (
        auth.role() = 'authenticated' and (
            school_id::text = public.current_teacher_school_id()::text or
            auth_user_id = auth.uid()
        )
    );

-- Scoped insert policy: Authenticated user inserting their own profile (matching auth.uid())
-- or school admin provisioning teachers for their own school
create policy "Teachers insert matching own auth session" on public.teachers
    for insert
    with check (
        auth.role() = 'authenticated' and (
            auth_user_id = auth.uid() or
            school_id::text = public.current_teacher_school_id()::text
        )
    );
