/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

create table if not exists public.teachers (
    teacher_id uuid primary key default gen_random_uuid(),
    school_id uuid references public.schools(school_id) on delete cascade,
    teacher_name text not null,
    teacher_login_id text not null,
    created_at timestamptz default now(),
    unique(school_id, teacher_login_id)
);

alter table public.teachers enable row level security;

-- Read policy for teachers
create policy "Allow read for teachers" on public.teachers
    for select using (true);

-- Insert policy for registration
create policy "Allow insert for teachers registration" on public.teachers
    for insert with check (true);
