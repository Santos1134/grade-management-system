-- Create a test student manually in Supabase
-- First, you need to create the user in Authentication dashboard:
-- Email: test.student@stpeter.com
-- Password: Test1234
-- Then run this SQL with the user ID from auth

-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from Supabase Auth
DO $$
DECLARE
  test_user_id UUID := 'YOUR_USER_ID_HERE'; -- REPLACE THIS
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (test_user_id, 'test.student@stpeter.com', 'Test Student', 'student')
  ON CONFLICT (id) DO NOTHING;

  -- Insert student record
  INSERT INTO public.students (id, student_id, grade, section)
  VALUES (test_user_id, 'STU0001', '7th Grade', 'A')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Verify the student was created
SELECT p.*, s.*
FROM profiles p
JOIN students s ON p.id = s.id
WHERE p.email = 'test.student@stpeter.com';
