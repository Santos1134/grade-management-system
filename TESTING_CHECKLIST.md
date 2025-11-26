# Grade Management System - Testing & Verification Checklist

## Prerequisites
- [ ] Run the database migration script (see DATABASE_MIGRATION.md)
- [ ] Clear browser cache and cookies
- [ ] Open browser DevTools Console (F12) for debugging

---

## 1. Database Migration Testing

### Run Migration Script
1. [ ] Go to Supabase Dashboard → SQL Editor
2. [ ] Copy contents from `supabase/UPDATE_SEMESTER_AVERAGE_FORMULA.sql`
3. [ ] Click "Run"
4. [ ] Verify success message
5. [ ] Check the verification query results show correct averages

### Verify Formula Correctness
Test with sample data:
- **Example**: Period1=80, Period2=85, Period3=90, Exam1=88
- **Expected Sem1 Avg**: ((80+85+90)/3 + 88)/2 = (85 + 88)/2 = **86.50**
- **Old Wrong Formula**: (80+85+90+88)/4 = **85.75** ❌

**Action Items:**
- [ ] Add a test grade with known values
- [ ] Verify semester average matches expected calculation
- [ ] Verify final average = (Sem1 + Sem2) / 2

---

## 2. Audit Log Testing

### Setup
- [ ] Open deployed app: https://grade-management-frontend-aptn66hlw-santos1134s-projects.vercel.app
- [ ] Log in as **Admin**
- [ ] Open DevTools Console (F12)

### Test 1: View Existing Audit Logs
- [ ] Click "View Audit Trail" button
- [ ] Console should show: "Loaded audit logs: [...]"
- [ ] Console should show: "Sample log details: {...}"
- [ ] Verify logs display in the modal

### Test 2: Verify Student Class Display
Look for logs with action "ADD_GRADES" or "UPDATE_GRADES":
- [ ] **Student name** is displayed
- [ ] **Class** shows grade level (e.g., "10th Grade")
- [ ] **Section** shows if available (e.g., "Section A")
- [ ] **Subjects** list is shown
- [ ] **Subject count** is accurate

### Test 3: Verify Grade Modification Tracking
- [ ] Log in as **Sponsor**
- [ ] Select a student who already has grades
- [ ] Click "View Grades"
- [ ] Modify an existing grade (e.g., change English Period1 from 75 to 80)
- [ ] Click "Update All Grades"
- [ ] Check Console for:
  - [ ] "Existing grades for student: [...]"
  - [ ] "Comparing existing grade for [Subject]: {...}"
  - [ ] "Change detected in period1: 75 -> 80"
  - [ ] "Grade changes for [Subject]: {...}"
  - [ ] "Audit Log Details: {...}" with gradeChanges array
  - [ ] "Edit Mode: true"

### Test 4: Verify Audit Trail Shows Modifications
- [ ] Log out, log back in as **Admin**
- [ ] Click "View Audit Trail"
- [ ] Find the UPDATE_GRADES entry
- [ ] Verify it shows:
  - [ ] ⚠️ Red warning box: "Grade Modifications Detected"
  - [ ] Subject name
  - [ ] Changed field with old value (strikethrough in red)
  - [ ] Arrow (→)
  - [ ] New value (in green)

---

## 3. Grade Display Testing

### Student Dashboard
- [ ] Log in as **Student**
- [ ] Verify grades display correctly
- [ ] Check period averages section shows "-" for empty periods (not 0.00)
- [ ] Check semester averages show "-" when not calculated
- [ ] Check overall average shows "-" when no grades exist
- [ ] Verify ranking only shows when average exists

### Sponsor Dashboard
- [ ] Log in as **Sponsor**
- [ ] Click "Add Grade" for a student
- [ ] Enter grades for all periods of a subject
- [ ] Verify Sem 1 Avg calculates correctly in the display
- [ ] Verify Sem 2 Avg calculates correctly in the display
- [ ] Verify Final Avg calculates correctly in the display
- [ ] Click "View Grades" on a student
- [ ] Verify semester and final averages match database calculations

---

## 4. Notification Testing

### Student Notifications
- [ ] Log in as **Sponsor**
- [ ] Add/update grades for a student
- [ ] Log in as that **Student**
- [ ] Verify notification bell shows indicator
- [ ] Click bell icon
- [ ] Verify notification shows the grade update message
- [ ] Close modal
- [ ] Verify notifications are marked as read

---

## 5. Grade Validation Testing

### Valid Ranges
- [ ] Try entering grade < 50 → Should show error
- [ ] Try entering grade > 100 → Should show error
- [ ] Enter grade = 50 → Should accept (minimum passing)
- [ ] Enter grade = 100 → Should accept (maximum)
- [ ] Enter grade between 50-69 → Should show in red (failing)
- [ ] Enter grade between 70-100 → Should show in blue (passing)

---

## 6. User Management Testing (Admin)

### Create User
- [ ] Create new Sponsor
- [ ] Create new Student
- [ ] Verify audit log captures user creation
- [ ] Verify new users can log in

### Reset Password
- [ ] Reset a user's password
- [ ] Verify audit log captures password reset
- [ ] Verify user can log in with new password

### Delete User
- [ ] Delete a user
- [ ] Verify audit log captures deletion
- [ ] Verify user cannot log in

---

## 7. Data Persistence Testing

### Grade Persistence
- [ ] Log in as Sponsor
- [ ] Add grades for a student
- [ ] Click "Save All Grades"
- [ ] Log out
- [ ] Log back in
- [ ] Verify grades still exist
- [ ] Verify semester/final averages are correct

### Cross-Role Verification
- [ ] Sponsor adds grades
- [ ] Student sees those grades immediately
- [ ] Admin sees the audit log entry
- [ ] All three roles see the same data

---

## 8. Performance Testing

### Loading Speed
- [ ] Dashboard loads in < 2 seconds
- [ ] Grade list loads in < 1 second
- [ ] Audit trail loads in < 2 seconds
- [ ] No infinite loading states

### Responsiveness
- [ ] Test on mobile device (or Chrome DevTools mobile view)
- [ ] All buttons are tappable (minimum 44x44px)
- [ ] No horizontal scrolling
- [ ] Forms are usable on small screens

---

## 9. Edge Cases

### Empty States
- [ ] Student with no grades shows appropriate message
- [ ] Sponsor with no students shows appropriate message
- [ ] Admin with no audit logs shows "No audit logs available"

### Concurrent Updates
- [ ] Two sponsors editing same student simultaneously
- [ ] Verify last save wins
- [ ] Verify both changes are logged

### Special Characters
- [ ] Student name with apostrophes (e.g., O'Brien)
- [ ] Comments with special characters
- [ ] Verify data saves and displays correctly

---

## 10. Console Verification

### Expected Console Logs
When saving grades, you should see:
```
Existing grades for student: [...]
Comparing existing grade for English: {...}
Change detected in period1: 75 -> 80
Grade changes for English: {...}
Audit Log Details: {studentId, studentName, studentGrade, studentSection, ...}
Grade Changes Detected: [{subject, changes}]
Edit Mode: true
```

When viewing audit trail:
```
Loaded audit logs: [...]
Sample log details: {...}
```

### No Errors Expected
- [ ] No red error messages in console
- [ ] No failed network requests
- [ ] No 404 or 500 errors

---

## 11. Final Checklist

### Before Production Release
- [ ] All database migrations applied successfully
- [ ] All tests above passing
- [ ] Remove debug console.log statements (see CLEANUP.md)
- [ ] Browser console shows no errors
- [ ] All features working as expected

### Production Verification
- [ ] Live site is accessible
- [ ] Login works for all user types
- [ ] Grade calculations are correct
- [ ] Audit log captures all changes
- [ ] Notifications work
- [ ] Print functionality works

---

## Issues Found

Document any issues found during testing:

| Test | Issue Description | Status | Notes |
|------|------------------|--------|-------|
|      |                  |        |       |

---

## Sign Off

- [ ] Database migration tested and verified
- [ ] Audit log tested and verified
- [ ] Grade calculations tested and verified
- [ ] All critical features tested
- [ ] Ready for production use

**Tested By:** _______________
**Date:** _______________
**Version:** v1.0.0
