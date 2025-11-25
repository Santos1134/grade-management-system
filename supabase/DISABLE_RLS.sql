-- Temporarily disable RLS to allow development
-- WARNING: This removes all security - only for development!

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_all_admin" ON public.profiles;

DROP POLICY IF EXISTS "students_select_own" ON public.students;
DROP POLICY IF EXISTS "students_select_admin" ON public.students;
DROP POLICY IF EXISTS "students_all_admin" ON public.students;

DROP POLICY IF EXISTS "sponsors_select_own" ON public.sponsors;
DROP POLICY IF EXISTS "sponsors_select_admin" ON public.sponsors;
DROP POLICY IF EXISTS "sponsors_all_admin" ON public.sponsors;

DROP POLICY IF EXISTS "admins_select" ON public.admins;
DROP POLICY IF EXISTS "admins_insert" ON public.admins;

DROP POLICY IF EXISTS "grades_select_student" ON public.grades;
DROP POLICY IF EXISTS "grades_select_admin" ON public.grades;
DROP POLICY IF EXISTS "grades_all_admin" ON public.grades;

DROP POLICY IF EXISTS "notifications_select_student" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_student" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_all" ON public.notifications;
DROP POLICY IF EXISTS "notifications_all_admin" ON public.notifications;

DROP POLICY IF EXISTS "change_log_select_own" ON public.change_log;
DROP POLICY IF EXISTS "change_log_select_admin" ON public.change_log;
DROP POLICY IF EXISTS "change_log_insert" ON public.change_log;

DROP POLICY IF EXISTS "reset_tokens_select_own" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "reset_tokens_all_admin" ON public.password_reset_tokens;
