
DROP VIEW IF EXISTS public.class_rankings_view CASCADE;

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

GRANT SELECT ON public.class_rankings_view TO authenticated;
GRANT SELECT ON public.class_rankings_view TO anon;

SELECT COUNT(*) as view_exists FROM information_schema.views 
WHERE table_schema = 'public' AND table_name = 'class_rankings_view';
