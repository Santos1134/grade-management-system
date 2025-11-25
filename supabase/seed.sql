-- =====================================================
-- SEED DATA - Grade Management System
-- Demo data for testing
-- =====================================================

-- Note: This assumes Supabase Auth users have been created
-- You'll need to replace the UUIDs with actual auth.users IDs from your Supabase project

-- =====================================================
-- DEMO USERS (Profiles)
-- =====================================================

-- Admin
INSERT INTO public.profiles (id, email, name, role) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@stpeter.com', 'Admin User', 'admin');

INSERT INTO public.admins (id) VALUES
('00000000-0000-0000-0000-000000000001');

-- Sponsors
INSERT INTO public.profiles (id, email, name, role) VALUES
('00000000-0000-0000-0000-000000000010', 'mrs.roberts@stpeter.com', 'Mrs. Roberts', 'sponsor'),
('00000000-0000-0000-0000-000000000011', 'mr.thompson@stpeter.com', 'Mr. Thompson', 'sponsor'),
('00000000-0000-0000-0000-000000000012', 'mrs.anderson@stpeter.com', 'Mrs. Anderson', 'sponsor'),
('00000000-0000-0000-0000-000000000013', 'mr.davis@stpeter.com', 'Mr. Davis', 'sponsor'),
('00000000-0000-0000-0000-000000000014', 'mrs.johnson@stpeter.com', 'Mrs. Johnson', 'sponsor');

INSERT INTO public.sponsors (id, grade, section) VALUES
('00000000-0000-0000-0000-000000000010', '7th Grade', 'A'),
('00000000-0000-0000-0000-000000000011', '7th Grade', 'B'),
('00000000-0000-0000-0000-000000000012', '8th Grade', 'A'),
('00000000-0000-0000-0000-000000000013', '8th Grade', 'B'),
('00000000-0000-0000-0000-000000000014', '10th Grade', NULL);

-- Students (7th Grade Section A)
INSERT INTO public.profiles (id, email, name, role) VALUES
('00000000-0000-0000-0000-000000000100', 'john.doe@stpeter.com', 'John Doe', 'student'),
('00000000-0000-0000-0000-000000000101', 'jane.smith@stpeter.com', 'Jane Smith', 'student');

INSERT INTO public.students (id, student_id, grade, section, sponsor_id) VALUES
('00000000-0000-0000-0000-000000000100', 'STU0001', '7th Grade', 'A', '00000000-0000-0000-0000-000000000010'),
('00000000-0000-0000-0000-000000000101', 'STU0002', '7th Grade', 'A', '00000000-0000-0000-0000-000000000010');

-- Students (7th Grade Section B)
INSERT INTO public.profiles (id, email, name, role) VALUES
('00000000-0000-0000-0000-000000000102', 'michael.brown@stpeter.com', 'Michael Brown', 'student'),
('00000000-0000-0000-0000-000000000103', 'sarah.johnson@stpeter.com', 'Sarah Johnson', 'student');

INSERT INTO public.students (id, student_id, grade, section, sponsor_id) VALUES
('00000000-0000-0000-0000-000000000102', 'STU0003', '7th Grade', 'B', '00000000-0000-0000-0000-000000000011'),
('00000000-0000-0000-0000-000000000103', 'STU0004', '7th Grade', 'B', '00000000-0000-0000-0000-000000000011');

-- Students (8th Grade Section A)
INSERT INTO public.profiles (id, email, name, role) VALUES
('00000000-0000-0000-0000-000000000104', 'david.williams@stpeter.com', 'David Williams', 'student'),
('00000000-0000-0000-0000-000000000105', 'emily.davis@stpeter.com', 'Emily Davis', 'student');

INSERT INTO public.students (id, student_id, grade, section, sponsor_id) VALUES
('00000000-0000-0000-0000-000000000104', 'STU0005', '8th Grade', 'A', '00000000-0000-0000-0000-000000000012'),
('00000000-0000-0000-0000-000000000105', 'STU0006', '8th Grade', 'A', '00000000-0000-0000-0000-000000000012');

-- Students (8th Grade Section B)
INSERT INTO public.profiles (id, email, name, role) VALUES
('00000000-0000-0000-0000-000000000106', 'james.wilson@stpeter.com', 'James Wilson', 'student'),
('00000000-0000-0000-0000-000000000107', 'olivia.martinez@stpeter.com', 'Olivia Martinez', 'student');

INSERT INTO public.students (id, student_id, grade, section, sponsor_id) VALUES
('00000000-0000-0000-0000-000000000106', 'STU0007', '8th Grade', 'B', '00000000-0000-0000-0000-000000000013'),
('00000000-0000-0000-0000-000000000107', 'STU0008', '8th Grade', 'B', '00000000-0000-0000-0000-000000000013');

-- Students (10th Grade - no sections)
INSERT INTO public.profiles (id, email, name, role) VALUES
('00000000-0000-0000-0000-000000000108', 'robert.johnson@stpeter.com', 'Robert Johnson', 'student'),
('00000000-0000-0000-0000-000000000109', 'emma.garcia@stpeter.com', 'Emma Garcia', 'student');

INSERT INTO public.students (id, student_id, grade, section, sponsor_id) VALUES
('00000000-0000-0000-0000-000000000108', 'STU0009', '10th Grade', NULL, '00000000-0000-0000-0000-000000000014'),
('00000000-0000-0000-0000-000000000109', 'STU0010', '10th Grade', NULL, '00000000-0000-0000-0000-000000000014');

-- =====================================================
-- DEMO GRADES
-- =====================================================

-- John Doe (7th Grade A) - Mathematics
INSERT INTO public.grades (student_id, subject, period1, period2, period3, exam1, period4, period5, period6, exam2, updated_by) VALUES
('00000000-0000-0000-0000-000000000100', 'Mathematics', 85, 88, 90, 87, 89, 91, 93, 90, '00000000-0000-0000-0000-000000000010'),
('00000000-0000-0000-0000-000000000100', 'English', 78, 82, 85, 80, 83, 86, 88, 85, '00000000-0000-0000-0000-000000000010');

-- Jane Smith (7th Grade A) - Top Student
INSERT INTO public.grades (student_id, subject, period1, period2, period3, exam1, period4, period5, period6, exam2, updated_by) VALUES
('00000000-0000-0000-0000-000000000101', 'Mathematics', 95, 96, 97, 96, 96, 97, 98, 97, '00000000-0000-0000-0000-000000000010'),
('00000000-0000-0000-0000-000000000101', 'English', 92, 94, 95, 93, 94, 96, 97, 95, '00000000-0000-0000-0000-000000000010');

-- Michael Brown (7th Grade B)
INSERT INTO public.grades (student_id, subject, period1, period2, period3, exam1, period4, period5, period6, exam2, updated_by) VALUES
('00000000-0000-0000-0000-000000000102', 'Mathematics', 75, 78, 80, 77, 79, 82, 84, 81, '00000000-0000-0000-0000-000000000011'),
('00000000-0000-0000-0000-000000000102', 'English', 80, 82, 84, 81, 83, 85, 87, 84, '00000000-0000-0000-0000-000000000011');

-- Emily Davis (8th Grade A)
INSERT INTO public.grades (student_id, subject, period1, period2, period3, exam1, period4, period5, period6, exam2, updated_by) VALUES
('00000000-0000-0000-0000-000000000105', 'Mathematics', 88, 90, 92, 89, 91, 93, 94, 92, '00000000-0000-0000-0000-000000000012'),
('00000000-0000-0000-0000-000000000105', 'English', 85, 87, 89, 86, 88, 90, 91, 89, '00000000-0000-0000-0000-000000000012');

-- =====================================================
-- DEMO CHANGE LOG
-- =====================================================

INSERT INTO public.change_log (user_id, user_name, action, details) VALUES
('00000000-0000-0000-0000-000000000001', 'Admin User', 'SYSTEM_INITIALIZED', '{"message": "System initialized with demo data"}'),
('00000000-0000-0000-0000-000000000010', 'Mrs. Roberts', 'ADD_GRADES', '{"student": "John Doe", "subjects": ["Mathematics", "English"]}');
