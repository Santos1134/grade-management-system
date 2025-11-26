-- =====================================================
-- GRADE MANAGEMENT SYSTEM - DATABASE SCHEMA
-- St. Peter Claver Catholic High School
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CUSTOM TYPES
-- =====================================================

CREATE TYPE user_role AS ENUM ('student', 'sponsor', 'admin');
CREATE TYPE grade_level AS ENUM ('7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade');
CREATE TYPE section_type AS ENUM ('A', 'B');

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students table
CREATE TABLE public.students (
  id UUID REFERENCES public.profiles(id) PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL, -- e.g., STU0001
  grade grade_level NOT NULL,
  section section_type, -- Only for 7th and 8th grade
  sponsor_id UUID REFERENCES public.sponsors(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: section required for 7th and 8th grade
  CONSTRAINT section_required_for_junior_grades CHECK (
    (grade IN ('7th Grade', '8th Grade') AND section IS NOT NULL) OR
    (grade NOT IN ('7th Grade', '8th Grade') AND section IS NULL)
  )
);

-- Sponsors table
CREATE TABLE public.sponsors (
  id UUID REFERENCES public.profiles(id) PRIMARY KEY,
  grade grade_level NOT NULL,
  section section_type, -- Only for 7th and 8th grade
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one sponsor per grade/section combination
  CONSTRAINT unique_sponsor_assignment UNIQUE (grade, section),

  -- Constraint: section required for 7th and 8th grade
  CONSTRAINT section_required_for_junior_grades CHECK (
    (grade IN ('7th Grade', '8th Grade') AND section IS NOT NULL) OR
    (grade NOT IN ('7th Grade', '8th Grade') AND section IS NULL)
  )
);

-- Admins table
CREATE TABLE public.admins (
  id UUID REFERENCES public.profiles(id) PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grades table
CREATE TABLE public.grades (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,

  -- Period grades (1-6)
  period1 NUMERIC(5,2) CHECK (period1 >= 50 AND period1 <= 100),
  period2 NUMERIC(5,2) CHECK (period2 >= 50 AND period2 <= 100),
  period3 NUMERIC(5,2) CHECK (period3 >= 50 AND period3 <= 100),
  exam1 NUMERIC(5,2) CHECK (exam1 >= 50 AND exam1 <= 100),
  sem1_av NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN period1 IS NOT NULL AND period2 IS NOT NULL AND period3 IS NOT NULL AND exam1 IS NOT NULL
      THEN (((period1 + period2 + period3) / 3.0) + exam1) / 2.0
      ELSE NULL
    END
  ) STORED,

  period4 NUMERIC(5,2) CHECK (period4 >= 50 AND period4 <= 100),
  period5 NUMERIC(5,2) CHECK (period5 >= 50 AND period5 <= 100),
  period6 NUMERIC(5,2) CHECK (period6 >= 50 AND period6 <= 100),
  exam2 NUMERIC(5,2) CHECK (exam2 >= 50 AND exam2 <= 100),
  sem2_av NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN period4 IS NOT NULL AND period5 IS NOT NULL AND period6 IS NOT NULL AND exam2 IS NOT NULL
      THEN (((period4 + period5 + period6) / 3.0) + exam2) / 2.0
      ELSE NULL
    END
  ) STORED,

  -- Final average (computed from period grades - cannot reference generated columns)
  final_average NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN period1 IS NOT NULL AND period2 IS NOT NULL AND period3 IS NOT NULL AND exam1 IS NOT NULL
           AND period4 IS NOT NULL AND period5 IS NOT NULL AND period6 IS NOT NULL AND exam2 IS NOT NULL
      THEN (
        (((period1 + period2 + period3) / 3.0) + exam1) / 2.0 +
        (((period4 + period5 + period6) / 3.0) + exam2) / 2.0
      ) / 2.0
      ELSE NULL
    END
  ) STORED,

  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id),

  -- Unique constraint: one grade entry per student per subject
  CONSTRAINT unique_student_subject UNIQUE (student_id, subject)
);

-- Change log / Audit trail
CREATE TABLE public.change_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL, -- e.g., 'CREATE_USER', 'UPDATE_GRADES', 'DELETE_USER'
  details JSONB, -- Store additional context as JSON
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Password reset tokens (for custom password reset flow)
CREATE TABLE public.password_reset_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Students
CREATE INDEX idx_students_grade ON public.students(grade);
CREATE INDEX idx_students_section ON public.students(section);
CREATE INDEX idx_students_sponsor ON public.students(sponsor_id);
CREATE INDEX idx_students_grade_section ON public.students(grade, section);

-- Sponsors
CREATE INDEX idx_sponsors_grade ON public.sponsors(grade);
CREATE INDEX idx_sponsors_section ON public.sponsors(section);

-- Grades
CREATE INDEX idx_grades_student ON public.grades(student_id);
CREATE INDEX idx_grades_subject ON public.grades(subject);
CREATE INDEX idx_grades_final_average ON public.grades(final_average);

-- Change log
CREATE INDEX idx_change_log_user ON public.change_log(user_id);
CREATE INDEX idx_change_log_timestamp ON public.change_log(timestamp);
CREATE INDEX idx_change_log_action ON public.change_log(action);

-- Notifications
CREATE INDEX idx_notifications_student ON public.notifications(student_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsors_updated_at BEFORE UPDATE ON public.sponsors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create notification when grades are added/updated
CREATE OR REPLACE FUNCTION notify_student_on_grade_change()
RETURNS TRIGGER AS $$
DECLARE
  student_name TEXT;
BEGIN
  -- Get student name
  SELECT p.name INTO student_name
  FROM public.profiles p
  JOIN public.students s ON p.id = s.id
  WHERE s.id = NEW.student_id;

  -- Create notification
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (student_id, message)
    VALUES (
      NEW.student_id,
      'New grades have been added for ' || NEW.subject
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.notifications (student_id, message)
    VALUES (
      NEW.student_id,
      'Grades have been updated for ' || NEW.subject
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for grade notifications
CREATE TRIGGER notify_on_grade_change
  AFTER INSERT OR UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION notify_student_on_grade_change();

-- Function to generate student ID
CREATE OR REPLACE FUNCTION generate_student_id()
RETURNS TEXT AS $$
DECLARE
  max_id INTEGER;
  new_id TEXT;
BEGIN
  -- Get the highest existing student ID number
  SELECT COALESCE(MAX(CAST(SUBSTRING(student_id FROM 4) AS INTEGER)), 0)
  INTO max_id
  FROM public.students;

  -- Generate new ID
  new_id := 'STU' || LPAD((max_id + 1)::TEXT, 4, '0');

  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- View: Student grades with student info
CREATE VIEW public.student_grades_view AS
SELECT
  s.id as student_id,
  s.student_id as student_number,
  p.name as student_name,
  p.email as student_email,
  s.grade,
  s.section,
  g.subject,
  g.period1, g.period2, g.period3, g.exam1, g.sem1_av,
  g.period4, g.period5, g.period6, g.exam2, g.sem2_av,
  g.final_average,
  g.comments,
  g.updated_at
FROM public.students s
JOIN public.profiles p ON s.id = p.id
LEFT JOIN public.grades g ON s.id = g.student_id
WHERE p.role = 'student';

-- View: Class rankings
CREATE VIEW public.class_rankings_view AS
WITH student_averages AS (
  SELECT
    s.id,
    s.student_id,
    p.name,
    s.grade,
    s.section,
    AVG(g.final_average) as overall_average
  FROM public.students s
  JOIN public.profiles p ON s.id = p.id
  LEFT JOIN public.grades g ON s.id = g.student_id
  WHERE g.final_average IS NOT NULL
  GROUP BY s.id, s.student_id, p.name, s.grade, s.section
)
SELECT
  id,
  student_id,
  name,
  grade,
  section,
  overall_average,
  RANK() OVER (
    PARTITION BY grade, section
    ORDER BY overall_average DESC
  ) as class_rank,
  COUNT(*) OVER (PARTITION BY grade, section) as total_students
FROM student_averages
ORDER BY grade, section, class_rank;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE public.students IS 'Student records with grade and section information';
COMMENT ON TABLE public.sponsors IS 'Sponsor (teacher) records assigned to specific grades/sections';
COMMENT ON TABLE public.admins IS 'Administrative users with full system access';
COMMENT ON TABLE public.grades IS 'Student grades with automatic average calculations';
COMMENT ON TABLE public.change_log IS 'Audit trail of all system changes';
COMMENT ON TABLE public.notifications IS 'Student notifications for grade updates';

COMMENT ON COLUMN public.students.section IS 'Section A or B (only for 7th and 8th grade)';
COMMENT ON COLUMN public.sponsors.section IS 'Section A or B (only for 7th and 8th grade)';
COMMENT ON COLUMN public.grades.sem1_av IS 'Automatically calculated as average of period1-3 and exam1';
COMMENT ON COLUMN public.grades.sem2_av IS 'Automatically calculated as average of period4-6 and exam2';
COMMENT ON COLUMN public.grades.final_average IS 'Automatically calculated as average of sem1_av and sem2_av';
