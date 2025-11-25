# Supabase Database Setup

This directory contains all the SQL scripts needed to set up the Supabase database for the Grade Management System.

## Files Overview

- **schema.sql** - Complete database schema with tables, indexes, triggers, and views
- **rls-policies.sql** - Row Level Security policies for data access control
- **seed.sql** - Demo data for testing (optional)

## Setup Instructions

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name**: Grade Management System
   - **Database Password**: (create a strong password)
   - **Region**: Choose closest to your location
5. Wait for project to be created (~2 minutes)

### Step 2: Run the SQL Scripts

#### Option A: Using Supabase Dashboard (Recommended)

1. Open your project in Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the contents of `schema.sql`
5. Click **Run** (or press Ctrl/Cmd + Enter)
6. Wait for completion (should see "Success" message)
7. Repeat for `rls-policies.sql`
8. (Optional) Repeat for `seed.sql`

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### Step 3: Get Your Project Credentials

1. Go to **Project Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### Step 4: Configure Environment Variables

Create a `.env.local` file in your project root:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Database Schema Overview

### Tables

#### Core Tables
- **profiles** - User profiles (extends Supabase auth.users)
- **students** - Student records with grade & section
- **sponsors** - Teacher/sponsor records
- **admins** - Administrative users
- **grades** - Student grades with auto-calculated averages
- **change_log** - Audit trail of all changes
- **notifications** - Student notifications
- **password_reset_tokens** - Password reset management

### Key Features

#### Automatic Grade Calculations
- **sem1_av** - Automatically calculated from period1-3 + exam1
- **sem2_av** - Automatically calculated from period4-6 + exam2
- **final_average** - Automatically calculated from sem1_av + sem2_av

#### Section Support
- 7th and 8th grades **require** sections (A or B)
- Other grades have **no sections**
- Database enforces this with CHECK constraints

#### Unique Constraints
- One sponsor per grade/section combination
- One grade entry per student per subject
- Unique student IDs (auto-generated: STU0001, STU0002, etc.)

### Views

- **student_grades_view** - Complete student grades with personal info
- **class_rankings_view** - Automatic ranking calculation per class/section

### Triggers

- **Auto-update timestamps** - `updated_at` automatically updated
- **Auto-create notifications** - Notifications created when grades added/updated
- **Generate student IDs** - Automatic sequential ID generation

## Row Level Security (RLS)

RLS policies ensure data security at the database level:

### Admin Permissions
- ✅ Full access to all tables
- ✅ Can create/update/delete any record
- ✅ Can view all audit logs

### Sponsor Permissions
- ✅ View students in their assigned grade/section only
- ✅ Add/update grades for their students only
- ✅ View their own profile
- ❌ Cannot access other grades/sections

### Student Permissions
- ✅ View their own grades only
- ✅ View their sponsor information
- ✅ View their notifications
- ✅ Mark notifications as read
- ❌ Cannot view other students' grades
- ❌ Cannot modify grades

## Testing the Setup

After running the scripts, test with these queries in SQL Editor:

```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- View all students with sections
SELECT s.student_id, p.name, s.grade, s.section
FROM students s
JOIN profiles p ON s.id = p.id;

-- View class rankings
SELECT * FROM class_rankings_view;

-- Test grade calculation (should auto-calculate averages)
SELECT
  subject,
  period1, period2, period3, exam1, sem1_av,
  period4, period5, period6, exam2, sem2_av,
  final_average
FROM grades
LIMIT 5;
```

## Common Issues & Solutions

### Issue: "relation does not exist"
**Solution**: Make sure you ran `schema.sql` before `rls-policies.sql`

### Issue: "permission denied"
**Solution**: Check that you're using the correct project and have admin access

### Issue: "function does not exist"
**Solution**: Re-run both `schema.sql` and `rls-policies.sql` in order

### Issue: Seed data UUIDs conflict
**Solution**: The seed.sql uses placeholder UUIDs. You'll need to:
1. Create users via Supabase Auth first
2. Get their actual UUIDs from `auth.users`
3. Update seed.sql with real UUIDs
4. Or skip seed.sql and use the app to create users

## Next Steps

After database setup is complete:

1. ✅ Install Supabase client: `npm install @supabase/supabase-js`
2. ✅ Configure environment variables
3. ✅ Create Supabase service layer in your app
4. ✅ Integrate Supabase Auth
5. ✅ Replace localStorage with Supabase API calls
6. ✅ Test all features

## Support

If you encounter issues:
- Check [Supabase Documentation](https://supabase.com/docs)
- Review [Supabase Discord](https://discord.supabase.com)
- Check project logs in Supabase Dashboard
