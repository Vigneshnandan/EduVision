
-- Seeder Script for EduVision Dashboard
-- Cleans up old mock data > 1,000,000 to avoid duplicates if run twice
DELETE FROM public.attendance WHERE id >= 1000000;

-- Function to generate mock data
DO $$
DECLARE
    v_class_names TEXT[] := ARRAY['Class 1A', 'Class 2B', 'Class 5A', 'Class 8B', 'Class 10C'];
    v_student_count INT := 50;
    v_days_back INT := 30;
    v_student_id BIGINT;
    v_name TEXT;
    v_class TEXT;
    v_roll TEXT;
    v_current_date BIGINT;
    v_is_present BOOLEAN;
    v_id_counter BIGINT := 1000000;
BEGIN
    FOR i IN 1..v_student_count LOOP
        -- Assign random class
        v_class := v_class_names[1 + floor(random() * array_length(v_class_names, 1))];
        v_name := 'Student ' || i;
        v_student_id := 1000000 + i;
        v_roll := 'R-' || i;

        -- Loop through last 30 days
        FOR d IN 0..v_days_back LOOP
            -- Calculate midnight timestamp for (Today - d)
            -- Note: in PostgreSQL, we can use `extract(epoch from ...)` but we need milliseconds for the schema req (int8)
            -- Logic: Get Date -> Truncate to day -> Convert to epoch * 1000
            
            -- SQL trick to get midnight ms
            v_current_date := (EXTRACT(EPOCH FROM (CURRENT_DATE - (d || ' days')::INTERVAL)) * 1000)::BIGINT;
            
            -- Random Attendance (80% Present)
            v_is_present := (random() < 0.8);

            -- Insert
            INSERT INTO public.attendance (
                id,
                student_id,
                name,
                class_name,
                roll_number,
                date,
                is_present,
                timestamp
            ) VALUES (
                v_id_counter,
                v_student_id,
                v_name,
                v_class,
                v_roll,
                v_current_date,
                v_is_present,
                v_current_date + 432000000 -- +12 hours (noon sync)
            );
            
            v_id_counter := v_id_counter + 1;
        END LOOP;
    END LOOP;
END $$;
