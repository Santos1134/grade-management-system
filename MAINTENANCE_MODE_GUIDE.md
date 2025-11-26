# Maintenance Mode - Admin Guide

## Overview
The maintenance mode feature allows administrators to temporarily block student logins while grades are being entered or updated. This prevents students from seeing incomplete or changing grades during the input process.

---

## How It Works

### For Administrators
- **Sponsors and Admins** can ALWAYS log in, regardless of maintenance mode status
- Access the toggle in the Admin Dashboard under **Security & Settings**

### For Students
- When maintenance mode is **ENABLED**, students cannot log in
- When students attempt to log in, they see a centered modal with:
  - Lock icon and clear "Access Temporarily Unavailable" message
  - The custom message set by the admin
  - A button to try again later

---

## Using Maintenance Mode

### Step 1: Enable Maintenance Mode

1. Log in as **Admin**
2. Look in the **Security & Settings** section (left sidebar)
3. Find the **Maintenance Mode** toggle button
4. Click the button to enable

**What happens:**
- Button turns RED with "ACTIVE" badge
- Text shows "Students cannot log in"
- All students are immediately blocked from logging in
- Current student sessions remain active (they won't be kicked out)

### Step 2: Perform Grade Updates

While maintenance mode is active:
- Sponsors can log in and enter/update grades
- Admins can manage users and view audit logs
- Students who try to log in see the maintenance message

### Step 3: Disable Maintenance Mode

1. Go back to **Admin Dashboard**
2. Click the **Maintenance Mode** toggle again

**What happens:**
- Button turns GRAY with "Inactive" badge
- Text shows "Click to block student access"
- Students can now log in normally

---

## Customizing the Message

The default message is:
> "Grades input is in progress. Please try again later."

To change this message:
1. Go to Supabase Dashboard → SQL Editor
2. Run this query:

```sql
UPDATE maintenance_mode
SET message = 'Your custom message here'
WHERE id = (SELECT id FROM maintenance_mode LIMIT 1);
```

Example custom messages:
- "We're updating final grades. Access will be restored at 3 PM."
- "Grade entry in progress. Please check back in 30 minutes."
- "System maintenance. Student access temporarily unavailable."

---

## Visual Guide

### Maintenance Mode Toggle - OFF (Default)
```
┌─────────────────────────────────────────────────┐
│ 🔓 Maintenance Mode: OFF            [Inactive] │
│    Click to block student access                │
└─────────────────────────────────────────────────┘
```
- Gray background
- Unlocked icon
- "Inactive" badge

### Maintenance Mode Toggle - ON (Active)
```
┌─────────────────────────────────────────────────┐
│ 🔒 Maintenance Mode: ON              [ACTIVE]  │
│    Students cannot log in                       │
└─────────────────────────────────────────────────┘
```
- Red background
- Locked icon
- "ACTIVE" badge in red

### What Students See When Blocked

When students try to log in during maintenance mode, they see a modal in the center of the screen:

```
╔═════════════════════════════════════════════════╗
║                      🔒                         ║
║                                                 ║
║   Student Access Temporarily Unavailable       ║
║                                                 ║
║  ⚠️  Grades input is in progress.              ║
║      Please try again later.                   ║
║                                                 ║
║  Our administrators are currently updating     ║
║  grades. Please try logging in again in a      ║
║  few minutes.                                  ║
║                                                 ║
║  [ OK, I'll Try Again Later ]                  ║
╚═════════════════════════════════════════════════╝
```

---

## Best Practices

### When to Use Maintenance Mode

✅ **Use maintenance mode when:**
- Beginning a bulk grade entry session
- Making final grade updates before report cards
- Correcting errors across multiple students
- During scheduled grade review periods
- When you want uninterrupted time to enter grades

❌ **Don't use maintenance mode when:**
- Making quick, individual grade updates
- Only updating one or two students
- System is otherwise functioning normally

### Recommended Workflow

1. **Before Starting:**
   - Announce to students (via email/announcement) that grades will be updated
   - Mention approximate duration (e.g., "Grades unavailable 2-4 PM")

2. **During Grade Entry:**
   - Enable maintenance mode
   - Enter/update grades for all students
   - Double-check entries for accuracy

3. **After Completion:**
   - Disable maintenance mode
   - Notify students that grades are now available

### Communication Template

Send this to students before enabling maintenance mode:

```
Subject: Grade Updates - Temporary Access Restriction

Dear Students,

We will be updating grades on [DATE] from [START TIME] to [END TIME].

During this time:
- You will not be able to log in to view your grades
- All grades will be updated by [END TIME]
- You can check your updated grades after [END TIME]

Thank you for your patience.
```

---

## Troubleshooting

### Issue: Students can still log in when mode is enabled
**Solution:**
1. Check that the toggle shows "ACTIVE" in red
2. Refresh the admin dashboard
3. Check the database:
   ```sql
   SELECT is_enabled FROM maintenance_mode LIMIT 1;
   ```
   Should return `true` when active

### Issue: Can't toggle maintenance mode
**Possible causes:**
- Not logged in as admin
- Database connection issue
- Table not created properly

**Solution:**
1. Verify you're logged in as admin
2. Check browser console for errors
3. Verify table exists:
   ```sql
   SELECT * FROM maintenance_mode;
   ```

### Issue: Want to check maintenance status
**Query:**
```sql
SELECT
  is_enabled,
  message,
  enabled_at,
  updated_at
FROM maintenance_mode
LIMIT 1;
```

---

## Database Information

### Table: `maintenance_mode`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `is_enabled` | BOOLEAN | True when maintenance mode is active |
| `message` | TEXT | Message shown to students |
| `enabled_by` | UUID | Admin who enabled it (NULL when disabled) |
| `enabled_at` | TIMESTAMP | When it was enabled |
| `updated_at` | TIMESTAMP | Last update time |

### Manual Database Control

**Enable maintenance mode:**
```sql
UPDATE maintenance_mode
SET
  is_enabled = true,
  enabled_at = NOW(),
  updated_at = NOW()
WHERE id = (SELECT id FROM maintenance_mode LIMIT 1);
```

**Disable maintenance mode:**
```sql
UPDATE maintenance_mode
SET
  is_enabled = false,
  enabled_by = NULL,
  enabled_at = NULL,
  updated_at = NOW()
WHERE id = (SELECT id FROM maintenance_mode LIMIT 1);
```

---

## Security Notes

- Only users with **admin role** can toggle maintenance mode
- Row Level Security (RLS) enforces this at the database level
- Everyone can read the status, but only admins can modify it
- Sponsors and admins are never blocked, ensuring system access

---

## Summary

Maintenance mode is a simple but powerful tool for managing student access during grade updates. Use it whenever you need uninterrupted time to work on grades, and remember to disable it when you're done!

**Quick Reference:**
- **Enable**: Admin Dashboard → Security & Settings → Click Maintenance Mode toggle
- **Disable**: Click the toggle again
- **Status**: Red = Active, Gray = Inactive
- **Effect**: Students blocked from login, Sponsors/Admins unaffected
