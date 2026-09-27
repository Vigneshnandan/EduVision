-- Create a table to store extra student details
-- This complements the read-only 'attendance' table
create table if not exists public.student_details (
    student_id text primary key, -- Matches the ID in attendance logs
    roll_number text,
    guardian_name text,
    contact_number text,
    address text,
    blood_group text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.student_details enable row level security;

-- Create policies (assuming public/anon access for this demo app context)
create policy "Allow generic read access" on public.student_details for select using (true);
create policy "Allow generic write access" on public.student_details for insert with check (true);
create policy "Allow generic update access" on public.student_details for update using (true);
