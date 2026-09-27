-- Create table for storing finalized daily MDM reports
CREATE TABLE IF NOT EXISTS public.mdm_daily_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date BIGINT NOT NULL, -- Midnight timestamp ms
    primary_count INTEGER NOT NULL DEFAULT 0,
    upper_primary_count INTEGER NOT NULL DEFAULT 0,
    rice_used_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,
    wheat_used_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_daily_report UNIQUE (report_date)
);

-- Establish RLS for mdm_daily_registers
ALTER TABLE public.mdm_daily_registers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.mdm_daily_registers FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.mdm_daily_registers FOR INSERT WITH CHECK (true);

-- Create table for tracking interventions on at-risk students
CREATE TABLE IF NOT EXISTS public.student_intervention_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id BIGINT NOT NULL,
    risk_reason TEXT,
    action_taken TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Establish RLS for student_intervention_logs
ALTER TABLE public.student_intervention_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.student_intervention_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.student_intervention_logs FOR INSERT WITH CHECK (true);
