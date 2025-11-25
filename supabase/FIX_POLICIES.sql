-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Sponsors can view student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Students can view own record" ON public.students;
DROP POLICY IF EXISTS "Sponsors can view assigned students" ON public.students;
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;

DROP POLICY IF EXISTS "Sponsors can view own record" ON public.sponsors;
DROP POLICY IF EXISTS "Students can view their sponsor" ON public.sponsors;
DROP POLICY IF EXISTS "Admins can manage sponsors" ON public.sponsors;

DROP POLICY IF EXISTS "Admins can view admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can create admins" ON public.admins;

DROP POLICY IF EXISTS "Students can view own grades" ON public.grades;
DROP POLICY IF EXISTS "Sponsors can view student grades" ON public.grades;
DROP POLICY IF EXISTS "Sponsors can manage student grades" ON public.grades;
DROP POLICY IF EXISTS "Admins can manage all grades" ON public.grades;

DROP POLICY IF EXISTS "Users can view own change log" ON public.change_log;
DROP POLICY IF EXISTS "Admins can view all change logs" ON public.change_log;
DROP POLICY IF EXISTS "Authenticated users can create change logs" ON public.change_log;

DROP POLICY IF EXISTS "Students can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Students can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;

DROP POLICY IF EXISTS "Users can view own reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Admins can manage reset tokens" ON public.password_reset_tokens;

-- Drop helper functions
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_sponsor();
DROP FUNCTION IF EXISTS public.is_student();
DROP FUNCTION IF EXISTS public.get_sponsor_grade_section();

-- Recreate helper functions with STABLE to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_sponsor()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.sponsors WHERE id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students WHERE id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Simplified policies without recursion

-- PROFILES POLICIES
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "profiles_all_admin" ON public.profiles
  FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- STUDENTS POLICIES
CREATE POLICY "students_select_own" ON public.students
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "students_select_admin" ON public.students
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "students_all_admin" ON public.students
  FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- SPONSORS POLICIES
CREATE POLICY "sponsors_select_own" ON public.sponsors
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "sponsors_select_admin" ON public.sponsors
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "sponsors_all_admin" ON public.sponsors
  FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- ADMINS POLICIES
CREATE POLICY "admins_select" ON public.admins
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "admins_insert" ON public.admins
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- GRADES POLICIES
CREATE POLICY "grades_select_student" ON public.grades
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "grades_select_admin" ON public.grades
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "grades_all_admin" ON public.grades
  FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- NOTIFICATIONS POLICIES
CREATE POLICY "notifications_select_student" ON public.notifications
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "notifications_update_student" ON public.notifications
  FOR UPDATE USING (student_id = auth.uid());

CREATE POLICY "notifications_insert_all" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "notifications_all_admin" ON public.notifications
  FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- CHANGE LOG POLICIES
CREATE POLICY "change_log_select_own" ON public.change_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "change_log_select_admin" ON public.change_log
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "change_log_insert" ON public.change_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- PASSWORD RESET TOKENS POLICIES
CREATE POLICY "reset_tokens_select_own" ON public.password_reset_tokens
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "reset_tokens_all_admin" ON public.password_reset_tokens
  FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));
