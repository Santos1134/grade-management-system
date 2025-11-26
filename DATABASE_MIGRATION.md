# Database Migration Guide

## ⚠️ IMPORTANT - Read Before Proceeding

This migration will update your semester and final average calculations. **Back up your database before proceeding.**

---

## What This Migration Does

### Problem Being Fixed
The current formula for semester averages is incorrect:
- **OLD (Wrong)**: Semester Avg = (Period1 + Period2 + Period3 + Exam) ÷ 4
- **NEW (Correct)**: Semester Avg = ((Period1 + Period2 + Period3) ÷ 3 + Exam) ÷ 2

### Impact
- All existing semester and final averages will be recalculated
- The change affects **sem1_av**, **sem2_av**, and **final_average** columns
- Students' final averages will change (some up, some down depending on their grades)

---

## Pre-Migration Checklist

- [ ] Back up your Supabase database
- [ ] Inform users that averages will be recalculated
- [ ] Schedule during low-traffic time if possible
- [ ] Have admin access to Supabase dashboard

---

## Migration Steps

### Step 1: Access Supabase SQL Editor
1. Log in to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **"New query"**

### Step 2: Run the Migration Script
1. Open the file `supabase/UPDATE_SEMESTER_AVERAGE_FORMULA.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)

### Step 3: Verify Success
You should see:
```
Success. No rows returned
```

The verification query at the end will show 5 sample records with recalculated averages.

### Step 4: Check Results
Review the sample data shown:
- Verify **sem1_av** values look reasonable
- Verify **sem2_av** values look reasonable
- Verify **final_average** = (sem1_av + sem2_av) ÷ 2

---

## Example Calculation

### Sample Student Grades
```
Period 1: 80
Period 2: 85
Period 3: 90
Exam 1:   88

Period 4: 75
Period 5: 80
Period 6: 85
Exam 2:   82
```

### Old Calculation (Wrong)
```
Sem 1 Avg = (80 + 85 + 90 + 88) / 4 = 85.75
Sem 2 Avg = (75 + 80 + 85 + 82) / 4 = 80.50
Final Avg = (85.75 + 80.50) / 2 = 83.13
```

### New Calculation (Correct)
```
Period Avg 1-3 = (80 + 85 + 90) / 3 = 85.00
Sem 1 Avg = (85.00 + 88) / 2 = 86.50 ✅

Period Avg 4-6 = (75 + 80 + 85) / 3 = 80.00
Sem 2 Avg = (80.00 + 82) / 2 = 81.00 ✅

Final Avg = (86.50 + 81.00) / 2 = 83.75 ✅
```

**Difference**: Final average changed from 83.13 to 83.75 (+0.62)

---

## Post-Migration Verification

### Manual Verification
1. **Query a few student records:**
   ```sql
   SELECT
     id,
     subject,
     period1, period2, period3, exam1, sem1_av,
     period4, period5, period6, exam2, sem2_av,
     final_average
   FROM public.grades
   WHERE period1 IS NOT NULL
   LIMIT 10;
   ```

2. **Manually calculate** semester average for one row
3. **Compare** with the database value

### Automated Verification
The migration script includes a verification query that shows:
- Column names
- Data types
- Generation expressions

Verify the generation expressions show the new formulas.

---

## Rollback Plan

If you need to rollback (NOT RECOMMENDED):

```sql
-- WARNING: This will revert to the WRONG formula
ALTER TABLE public.grades
  DROP COLUMN IF EXISTS sem1_av CASCADE,
  DROP COLUMN IF EXISTS sem2_av CASCADE,
  DROP COLUMN IF EXISTS final_average CASCADE;

ALTER TABLE public.grades
  ADD COLUMN sem1_av NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN period1 IS NOT NULL AND period2 IS NOT NULL AND period3 IS NOT NULL AND exam1 IS NOT NULL
      THEN (period1 + period2 + period3 + exam1) / 4.0
      ELSE NULL
    END
  ) STORED;

ALTER TABLE public.grades
  ADD COLUMN sem2_av NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN period4 IS NOT NULL AND period5 IS NOT NULL AND period6 IS NOT NULL AND exam2 IS NOT NULL
      THEN (period4 + period5 + period6 + exam2) / 4.0
      ELSE NULL
    END
  ) STORED;

ALTER TABLE public.grades
  ADD COLUMN final_average NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN period1 IS NOT NULL AND period2 IS NOT NULL AND period3 IS NOT NULL AND exam1 IS NOT NULL
           AND period4 IS NOT NULL AND period5 IS NOT NULL AND period6 IS NOT NULL AND exam2 IS NOT NULL
      THEN (
        (period1 + period2 + period3 + exam1) / 4.0 +
        (period4 + period5 + period6 + exam2) / 4.0
      ) / 2.0
      ELSE NULL
    END
  ) STORED;
```

---

## Troubleshooting

### Error: "column does not exist"
- The migration has already been run
- Check if columns exist: `\d grades` in SQL Editor

### Error: "permission denied"
- Ensure you have admin access to the database
- Check RLS policies aren't blocking the operation

### Error: "cannot use generated column in expression"
- This is expected - the migration script handles this
- Make sure you're running the complete script, not partial sections

---

## Communication Template

### For Users
```
NOTICE: Grade Average Calculation Update

We're updating how semester averages are calculated to be more accurate.

What's changing:
- Semester averages will now properly weight period grades vs exam grades
- Your final averages may change slightly (typically by ±0.5 points)

When: [Date/Time]
Downtime: None expected
Action Required: None - changes are automatic

Questions? Contact your administrator.
```

---

## Migration Complete ✅

After successful migration:
- [ ] Verify sample calculations are correct
- [ ] Notify users of the update
- [ ] Monitor for any issues
- [ ] Test the application end-to-end
- [ ] Update documentation

**Migration Date:** _______________
**Performed By:** _______________
**Status:** ⬜ Success  ⬜ Failed  ⬜ Rolled Back
