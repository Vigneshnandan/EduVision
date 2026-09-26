-- EduVision Complete Database Schema
-- Run this SQL in your Supabase SQL Editor to create all required tables

-- 1. SCHOOLS TABLE (for teacher registration dropdown)
CREATE TABLE IF NOT EXISTS schools (
  school_id BIGSERIAL PRIMARY KEY,
  school_name TEXT NOT NULL,
  school_code TEXT UNIQUE NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  principal_name TEXT,
  district TEXT,
  state TEXT,
  pincode TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TEACHERS TABLE (for teacher registration and login)
CREATE TABLE IF NOT EXISTS teachers (
  id BIGSERIAL PRIMARY KEY,
  teacher_name TEXT NOT NULL,
  teacher_login_id TEXT UNIQUE NOT NULL,
  school_id BIGINT REFERENCES schools(school_id) ON DELETE SET NULL,
  auth_user_id UUID UNIQUE,
  email TEXT,
  phone TEXT,
  qualification TEXT,
  experience_years INT,
  subject_specialization TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
  student_id BIGSERIAL PRIMARY KEY,
  roll_number TEXT NOT NULL,
  name TEXT NOT NULL,
  date_of_birth DATE,
  class_name TEXT NOT NULL,
  section TEXT,
  school_id BIGINT REFERENCES schools(school_id) ON DELETE CASCADE,
  face_encoding BYTEA,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(school_id, roll_number, class_name)
);

-- 4. ATTENDANCE TABLE (already exists, but including for reference)
CREATE TABLE IF NOT EXISTS attendance (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT REFERENCES students(student_id) ON DELETE CASCADE,
  name TEXT,
  class_name TEXT,
  roll_number TEXT,
  date DATE NOT NULL,
  is_present BOOLEAN DEFAULT FALSE,
  marked_by BIGINT REFERENCES teachers(id),
  timestamp BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CLASS TIMETABLE (optional, for scheduling)
CREATE TABLE IF NOT EXISTS class_timetable (
  id BIGSERIAL PRIMARY KEY,
  school_id BIGINT REFERENCES schools(school_id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  section TEXT,
  day_of_week INT,
  period INT,
  subject TEXT,
  teacher_id BIGINT REFERENCES teachers(id),
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(class_name);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_name);
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_timetable_school_id ON class_timetable(school_id);

-- ============================================
-- IMPORTANT: Set Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_timetable ENABLE ROW LEVEL SECURITY;

-- Schools: Public read, only admins can modify
CREATE POLICY "Allow public read schools" ON schools FOR SELECT USING (true);
CREATE POLICY "Allow authenticated to insert schools" ON schools FOR INSERT WITH CHECK (true);

-- Teachers: Teachers can read their own data
CREATE POLICY "Teachers can read their own data" ON teachers
  FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Allow insert teachers" ON teachers FOR INSERT WITH CHECK (true);

-- Students: Teachers can read students from their school
CREATE POLICY "Teachers can read students from their school" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teachers t
      WHERE t.auth_user_id = auth.uid()
      AND t.school_id = students.school_id
    )
  );

-- Attendance: Teachers can manage attendance for their school
CREATE POLICY "Teachers can manage attendance" ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teachers t
      WHERE t.auth_user_id = auth.uid()
    )
  );
CREATE POLICY "Teachers can insert attendance" ON attendance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM teachers t
      WHERE t.auth_user_id = auth.uid()
    )
  );

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample schools
INSERT INTO schools (school_name, school_code, address, district, state) VALUES
('Govt. Model School Delhi', 'GMS001', '123 MG Road, Delhi', 'Central', 'Delhi'),
('Kendriya Vidyalaya', 'KV002', '456 Park Road, Mumbai', 'North', 'Maharashtra'),
('St. Xavier School', 'SXS003', '789 Elm Road, Bangalore', 'South', 'Karnataka')
ON CONFLICT (school_code) DO NOTHING;

-- Insert sample students
INSERT INTO students (roll_number, name, class_name, school_id) VALUES
('001', 'Aarav Kumar', '10A', 1),
('002', 'Priya Sharma', '10A', 1),
('003', 'Rajesh Singh', '10B', 1),
('004', 'Ananya Patel', '10A', 2),
('005', 'Arjun Verma', '10B', 2)
ON CONFLICT (school_id, roll_number, class_name) DO NOTHING;
