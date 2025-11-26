-- Fix notification trigger for grade changes
-- Run this in Supabase SQL Editor

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS notify_on_grade_change ON public.grades;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS notify_student_on_grade_change();

-- Recreate the function to create notifications when grades are added/updated
CREATE OR REPLACE FUNCTION notify_student_on_grade_change()
RETURNS TRIGGER AS $$
DECLARE
  student_name TEXT;
BEGIN
  -- Get student name (optional, not currently used)
  SELECT p.name INTO student_name
  FROM public.profiles p
  JOIN public.students s ON p.id = s.id
  WHERE s.id = NEW.student_id;

  -- Create notification based on operation type
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (student_id, message, read)
    VALUES (
      NEW.student_id,
      'New grades have been added for ' || NEW.subject,
      false
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only create notification if actual grade values changed
    IF (OLD.period1 IS DISTINCT FROM NEW.period1) OR
       (OLD.period2 IS DISTINCT FROM NEW.period2) OR
       (OLD.period3 IS DISTINCT FROM NEW.period3) OR
       (OLD.exam1 IS DISTINCT FROM NEW.exam1) OR
       (OLD.period4 IS DISTINCT FROM NEW.period4) OR
       (OLD.period5 IS DISTINCT FROM NEW.period5) OR
       (OLD.period6 IS DISTINCT FROM NEW.period6) OR
       (OLD.exam2 IS DISTINCT FROM NEW.exam2) OR
       (OLD.comments IS DISTINCT FROM NEW.comments) THEN
      INSERT INTO public.notifications (student_id, message, read)
      VALUES (
        NEW.student_id,
        'Grades have been updated for ' || NEW.subject,
        false
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER notify_on_grade_change
  AFTER INSERT OR UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION notify_student_on_grade_change();

-- Verify the trigger was created
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'notify_on_grade_change';
