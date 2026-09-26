-- Fix Attendance Table Schema to Match App Data

-- ============================================
-- 1. UPDATE ATTENDANCE TABLE STRUCTURE
-- ============================================

-- Add missing columns to attendance table
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS school_id TEXT;

-- Make sure date is stored as BIGINT (timestamp)
-- If it's currently a DATE type, we'll keep it but add comments
-- The app sends date as BIGINT (milliseconds since epoch)

-- ============================================
-- 2. UPDATE STUDENT_DETAILS TABLE
-- ============================================

-- Recreate student_details with correct schema
DROP TABLE IF EXISTS student_details CASCADE;

CREATE TABLE student_details (
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
-- 3. FIX ATTENDANCE TABLE IF NEEDED
-- ============================================

-- Make sure timestamp is BIGINT
ALTER TABLE attendance
ALTER COLUMN timestamp SET DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT;

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY & POLICIES
-- ============================================

-- Attendance
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all attendance operations" ON attendance;
CREATE POLICY "Allow all attendance operations" ON attendance FOR ALL USING (true);

-- Student Details
ALTER TABLE student_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all student_details operations" ON student_details;
CREATE POLICY "Allow all student_details operations" ON student_details FOR ALL USING (true);

-- ============================================
-- 5. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_school_id ON attendance(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_student_details_student_id ON student_details(student_id);
CREATE INDEX IF NOT EXISTS idx_student_details_school_id ON student_details(school_id);

-- ============================================
-- 6. VERIFY SCHEMA
-- ============================================

SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('attendance', 'student_details')
ORDER BY table_name, ordinal_position;
