
-- Create a table for global school settings
CREATE TABLE IF NOT EXISTS public.school_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    key text NOT NULL,
    value jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT school_settings_pkey PRIMARY KEY (id),
    CONSTRAINT school_settings_key_key UNIQUE (key)
);

-- Policy to allow read access to authenticated users (adjust as needed)
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.school_settings
FOR SELECT USING (true);
