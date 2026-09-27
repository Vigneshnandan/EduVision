-- Add at_risk_threshold_pct to schools
alter table public.schools add column if not exists at_risk_threshold_pct int not null default 75;

-- Create the missing MDM registers table (so the dashboard has a place to save reports)
create table if not exists public.mdm_daily_registers (
    id uuid primary key default gen_random_uuid(),
    school_id bigint not null references public.schools(school_id) on delete cascade,
    report_date int8 not null,
    primary_count int not null default 0,
    upper_primary_count int not null default 0,
    rice_used_kg numeric not null default 0,
    wheat_used_kg numeric not null default 0,
    created_at timestamptz default now(),
    -- The unique constraint required for the .upsert() to work correctly
    unique (report_date, school_id)
);
alter table public.mdm_daily_registers enable row level security;

-- Update policy for mdm_daily_registers
-- Ensures teachers can only update their own school's registers
create policy "Allow updates for same school" on public.mdm_daily_registers
    for update using (
        school_id::text = public.current_teacher_school_id()
    );
create policy "Allow inserts for same school" on public.mdm_daily_registers
    for insert with check (
        school_id::text = public.current_teacher_school_id()
    );
create policy "Allow reads for same school" on public.mdm_daily_registers
    for select using (
        school_id::text = public.current_teacher_school_id()
    );
