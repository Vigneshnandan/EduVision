/*
 * Copyright © 2026 EduVision. All rights reserved.
 *
 * This file is part of EduVision and is original EduVision IP.
 * Draft for human/legal review, not a final legal filing.
 */

create table if not exists public.schools (
    school_id uuid primary key default gen_random_uuid(),
    school_name text not null,
    school_code text unique,              -- optional short code for dropdown search
    address text,
    created_at timestamptz default now()
);

alter table public.schools enable row level security;

-- Read-only, unauthenticated: needed so the Register screen's dropdown
-- can be pre-fetched before a teacher account exists.
create policy "Public read for school directory" on public.schools
    for select using (true);
