-- Update semester average calculation formula
-- Run this in Supabase SQL Editor to fix the semester average calculations

-- The correct formula is:
-- Semester Average = ((Period1 + Period2 + Period3) / 3 + Exam) / 2
-- Final Average = (Sem1 Average + Sem2 Average) / 2

-- First, drop the old computed columns
ALTER TABLE public.grades
  DROP COLUMN IF EXISTS sem1_av CASCADE,
  DROP COLUMN IF EXISTS sem2_av CASCADE,
  DROP COLUMN IF EXISTS final_average CASCADE;

-- Add back the computed columns with corrected formulas
ALTER TABLE public.grades
  ADD COLUMN sem1_av NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN period1 IS NOT NULL AND period2 IS NOT NULL AND period3 IS NOT NULL AND exam1 IS NOT NULL
      THEN (((period1 + period2 + period3) / 3.0) + exam1) / 2.0
      ELSE NULL
    END
  ) STORED;

ALTER TABLE public.grades
  ADD COLUMN sem2_av NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN period4 IS NOT NULL AND period5 IS NOT NULL AND period6 IS NOT NULL AND exam2 IS NOT NULL
      THEN (((period4 + period5 + period6) / 3.0) + exam2) / 2.0
      ELSE NULL
    END
  ) STORED;

ALTER TABLE public.grades
  ADD COLUMN final_average NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN sem1_av IS NOT NULL AND sem2_av IS NOT NULL
      THEN (sem1_av + sem2_av) / 2.0
      ELSE NULL
    END
  ) STORED;

-- Recreate the index
CREATE INDEX IF NOT EXISTS idx_grades_final_average ON public.grades(final_average);

-- Verify the changes
SELECT
  id,
  subject,
  period1, period2, period3, exam1, sem1_av,
  period4, period5, period6, exam2, sem2_av,
  final_average
FROM public.grades
WHERE period1 IS NOT NULL
LIMIT 5;

-- Show the new column definitions
SELECT
  column_name,
  data_type,
  generation_expression
FROM information_schema.columns
WHERE table_name = 'grades'
  AND column_name IN ('sem1_av', 'sem2_av', 'final_average');
