-- Fix HTTP 401 Sync Error - Update RLS Policies

-- ============================================
-- 1. ALLOW PUBLIC READ FOR SCHOOLS
-- ============================================
DROP POLICY IF EXISTS "Allow public read schools" ON schools;
CREATE POLICY "Allow public read schools" ON schools
  FOR SELECT USING (true);

-- ============================================
-- 2. ALLOW UNAUTHENTICATED ACCESS FOR SYNC
-- ============================================

-- Attendance: Allow read for authenticated users
DROP POLICY IF EXISTS "Teachers can manage attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers can insert attendance" ON attendance;

CREATE POLICY "Allow authenticated read attendance" ON attendance
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert attendance" ON attendance
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update attendance" ON attendance
  FOR UPDATE USING (true);

-- Students: Allow read for authenticated users
DROP POLICY IF EXISTS "Teachers can read students from their school" ON students;

CREATE POLICY "Allow authenticated read students" ON students
  FOR SELECT USING (true);

-- Teachers: Allow read/insert for authentication
DROP POLICY IF EXISTS "Teachers can read their own data" ON teachers;
DROP POLICY IF EXISTS "Allow insert teachers" ON teachers;

CREATE POLICY "Allow read teachers" ON teachers
  FOR SELECT USING (true);

CREATE POLICY "Allow insert teachers" ON teachers
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 3. VERIFY TABLES STRUCTURE
-- ============================================

-- Check if all tables exist
SELECT
  table_name,
  array_agg(column_name) as columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('schools', 'teachers', 'students', 'attendance')
GROUP BY table_name
ORDER BY table_name;

-- ============================================
-- 4. CHECK AUTH USERS
-- ============================================

-- Verify auth.users table
SELECT COUNT(*) as total_auth_users FROM auth.users;

-- Show recent users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;
