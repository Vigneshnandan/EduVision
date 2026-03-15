-- OPTION 1: RELOAD SCHEMA CACHE
-- Run this if the tables definitely exist but the API isn't seeing them.
NOTIFY pgrst, 'reload config';


-- OPTION 2: CREATE TABLES (IF MISSING)
-- If the tables don't exist, run this entire block.

CREATE TABLE IF NOT EXISTS public.students (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id text NOT NULL,
    name text,
    class_name text,
    roll_number text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT students_pkey PRIMARY KEY (id),
    CONSTRAINT students_student_id_key UNIQUE (student_id)
);

CREATE TABLE IF NOT EXISTS public.attendance_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    student_id text,
    date date,
    timestamp timestamp with time zone,
    is_present boolean,
    device_id text,
    CONSTRAINT attendance_logs_pkey PRIMARY KEY (id),
    CONSTRAINT attendance_logs_student_id_fkey FOREIGN KEY (student_id)
        REFERENCES public.students (student_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
);

-- OPTION 3: FIX PERMISSIONS (RLS)
-- If tables exist but you get 401/Empty Data errors.
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- Note: These policies allow ANYONE to read. Adjust for production.
CREATE POLICY "Allow public read access" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON public.attendance_logs FOR SELECT USING (true);
