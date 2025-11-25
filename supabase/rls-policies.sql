-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Grade Management System
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user is sponsor
CREATE OR REPLACE FUNCTION public.is_sponsor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sponsors WHERE id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user is student
CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students WHERE id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to get sponsor's grade and section
CREATE OR REPLACE FUNCTION public.get_sponsor_grade_section()
RETURNS TABLE(grade grade_level, section section_type) AS $$
  SELECT s.grade, s.section
  FROM public.sponsors s
  WHERE s.id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Sponsors can view student profiles in their grade/section
CREATE POLICY "Sponsors can view student profiles"
  ON public.profiles FOR SELECT
  USING (
    public.is_sponsor() AND
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.sponsors sp ON sp.id = auth.uid()
      WHERE s.id = profiles.id
        AND s.grade = sp.grade
        AND (sp.section IS NULL OR s.section = sp.section)
    )
  );

-- Admins can insert/update/delete profiles
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- STUDENTS TABLE POLICIES
-- =====================================================

-- Students can view their own record
CREATE POLICY "Students can view own record"
  ON public.students FOR SELECT
  USING (auth.uid() = id);

-- Sponsors can view students in their grade/section
CREATE POLICY "Sponsors can view assigned students"
  ON public.students FOR SELECT
  USING (
    public.is_sponsor() AND
    EXISTS (
      SELECT 1
      FROM public.sponsors sp
      WHERE sp.id = auth.uid()
        AND sp.grade = students.grade
        AND (sp.section IS NULL OR sp.section = students.section)
    )
  );

-- Admins can manage all students
CREATE POLICY "Admins can manage students"
  ON public.students FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- SPONSORS TABLE POLICIES
-- =====================================================

-- Sponsors can view their own record
CREATE POLICY "Sponsors can view own record"
  ON public.sponsors FOR SELECT
  USING (auth.uid() = id);

-- Students can view their sponsor
CREATE POLICY "Students can view their sponsor"
  ON public.sponsors FOR SELECT
  USING (
    public.is_student() AND
    EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.id = auth.uid()
        AND s.grade = sponsors.grade
        AND (sponsors.section IS NULL OR s.section = sponsors.section)
    )
  );

-- Admins can manage all sponsors
CREATE POLICY "Admins can manage sponsors"
  ON public.sponsors FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- ADMINS TABLE POLICIES
-- =====================================================

-- Admins can view all admin records
CREATE POLICY "Admins can view admins"
  ON public.admins FOR SELECT
  USING (public.is_admin());

-- Only admins can create admin records
CREATE POLICY "Admins can create admins"
  ON public.admins FOR INSERT
  WITH CHECK (public.is_admin());

-- =====================================================
-- GRADES TABLE POLICIES
-- =====================================================

-- Students can view their own grades
CREATE POLICY "Students can view own grades"
  ON public.grades FOR SELECT
  USING (
    public.is_student() AND
    student_id = auth.uid()
  );

-- Sponsors can view grades for their students
CREATE POLICY "Sponsors can view student grades"
  ON public.grades FOR SELECT
  USING (
    public.is_sponsor() AND
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.sponsors sp ON sp.id = auth.uid()
      WHERE s.id = grades.student_id
        AND s.grade = sp.grade
        AND (sp.section IS NULL OR s.section = sp.section)
    )
  );

-- Sponsors can insert/update grades for their students
CREATE POLICY "Sponsors can manage student grades"
  ON public.grades FOR ALL
  USING (
    public.is_sponsor() AND
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.sponsors sp ON sp.id = auth.uid()
      WHERE s.id = grades.student_id
        AND s.grade = sp.grade
        AND (sp.section IS NULL OR s.section = sp.section)
    )
  )
  WITH CHECK (
    public.is_sponsor() AND
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.sponsors sp ON sp.id = auth.uid()
      WHERE s.id = grades.student_id
        AND s.grade = sp.grade
        AND (sp.section IS NULL OR s.section = sp.section)
    )
  );

-- Admins can manage all grades
CREATE POLICY "Admins can manage all grades"
  ON public.grades FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- CHANGE LOG POLICIES
-- =====================================================

-- Users can view their own change log entries
CREATE POLICY "Users can view own change log"
  ON public.change_log FOR SELECT
  USING (user_id = auth.uid());

-- Admins can view all change logs
CREATE POLICY "Admins can view all change logs"
  ON public.change_log FOR SELECT
  USING (public.is_admin());

-- All authenticated users can create change log entries
CREATE POLICY "Authenticated users can create change logs"
  ON public.change_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

-- Students can view their own notifications
CREATE POLICY "Students can view own notifications"
  ON public.notifications FOR SELECT
  USING (
    public.is_student() AND
    student_id = auth.uid()
  );

-- Students can update their own notifications (mark as read)
CREATE POLICY "Students can update own notifications"
  ON public.notifications FOR UPDATE
  USING (
    public.is_student() AND
    student_id = auth.uid()
  )
  WITH CHECK (
    public.is_student() AND
    student_id = auth.uid()
  );

-- System can create notifications (triggered by grade changes)
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Admins can manage all notifications
CREATE POLICY "Admins can manage notifications"
  ON public.notifications FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- PASSWORD RESET TOKENS POLICIES
-- =====================================================

-- Users can view their own reset tokens
CREATE POLICY "Users can view own reset tokens"
  ON public.password_reset_tokens FOR SELECT
  USING (user_id = auth.uid());

-- Admins can manage all reset tokens
CREATE POLICY "Admins can manage reset tokens"
  ON public.password_reset_tokens FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.students TO authenticated;
GRANT ALL ON public.sponsors TO authenticated;
GRANT ALL ON public.admins TO authenticated;
GRANT ALL ON public.grades TO authenticated;
GRANT ALL ON public.change_log TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.password_reset_tokens TO authenticated;

-- Grant permissions on views
GRANT SELECT ON public.student_grades_view TO authenticated;
GRANT SELECT ON public.class_rankings_view TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_sponsor() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_student() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sponsor_grade_section() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_student_id() TO authenticated;
