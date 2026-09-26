-- Fix Sync Issues - Create Missing Tables and Update RLS

-- ============================================
-- 1. CREATE STUDENT_DETAILS TABLE (for sync)
-- ============================================
CREATE TABLE IF NOT EXISTS student_details (
  id BIGSERIAL PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  school_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, school_id)
);

-- ============================================
-- 2. DISABLE STRICT RLS (Allow sync to work)
-- ============================================

-- Attendance Table - Allow all operations
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;

-- Or if you want to keep RLS, use permissive policies:
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read attendance" ON attendance;
DROP POLICY IF EXISTS "Allow authenticated insert attendance" ON attendance;
DROP POLICY IF EXISTS "Allow authenticated update attendance" ON attendance;

CREATE POLICY "Allow all attendance operations" ON attendance
  FOR ALL USING (true);

-- Student Details Table - Allow all operations
ALTER TABLE student_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all student_details" ON student_details;

CREATE POLICY "Allow all student_details operations" ON student_details
  FOR ALL USING (true);

-- Students Table - Allow all operations
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read students" ON students;

CREATE POLICY "Allow all students operations" ON students
  FOR ALL USING (true);

-- Teachers Table - Allow all operations
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read teachers" ON teachers;
DROP POLICY IF EXISTS "Allow insert teachers" ON teachers;

CREATE POLICY "Allow all teachers operations" ON teachers
  FOR ALL USING (true);

-- Schools Table - Allow all operations
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read schools" ON schools;

CREATE POLICY "Allow all schools operations" ON schools
  FOR ALL USING (true);

-- ============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_student_details_school_id ON student_details(school_id);
CREATE INDEX IF NOT EXISTS idx_student_details_student_id ON student_details(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_school_id ON attendance(student_id);

-- ============================================
-- 4. VERIFY TABLES EXIST
-- ============================================

SELECT
  table_name,
  array_agg(column_name) as columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('schools', 'teachers', 'students', 'student_details', 'attendance')
GROUP BY table_name
ORDER BY table_name;

-- ============================================
-- 5. TEST DATA - Insert sample attendance
-- ============================================

-- Make sure we have students to sync
INSERT INTO student_details (student_id, student_name, class_name, roll_number, school_id)
VALUES
  ('1', 'Aarav Kumar', '10A', '001', '1'),
  ('2', 'Priya Sharma', '10A', '002', '1'),
  ('3', 'Rajesh Singh', '10B', '003', '1')
ON CONFLICT DO NOTHING;

-- Insert test attendance record
INSERT INTO attendance (student_id, name, class_name, roll_number, date, is_present, timestamp, created_at)
VALUES
  (1, 'Aarav Kumar', '10A', '001', CURRENT_DATE, true, EXTRACT(EPOCH FROM NOW())::BIGINT, NOW())
ON CONFLICT DO NOTHING;
