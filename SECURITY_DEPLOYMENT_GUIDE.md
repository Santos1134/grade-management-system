# Security Implementation Deployment Guide

## Overview

This guide explains how to deploy the new **remote storage security system** that uses Supabase instead of client-side localStorage. This implementation provides true server-side security that cannot be bypassed by clearing browser data.

---

## 🚀 What Changed

### Before (localStorage - Client-Side Only)
- ❌ Rate limiting stored in browser localStorage
- ❌ Could be bypassed by clearing browser data
- ❌ Could be bypassed using incognito mode
- ❌ No centralized security monitoring
- ❌ Data lost when changing devices/browsers

### After (Supabase - Remote Storage)
- ✅ Rate limiting stored in Supabase database
- ✅ Cannot be bypassed by clearing browser data
- ✅ Works across all devices and browsers
- ✅ Centralized security monitoring for admins
- ✅ Persistent security data with audit trails

---

## 📋 Deployment Steps

### Step 1: Run the SQL Migration

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Open the file: `supabase/CREATE_LOGIN_SECURITY_TABLE.sql`
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click **Run** to create the tables

This will create:
- `login_attempts` - Tracks all login attempts
- `rate_limits` - Tracks rate limiting per email
- `security_events` - Logs security events

### Step 2: Verify Tables Were Created

Run this query in Supabase SQL Editor:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('login_attempts', 'rate_limits', 'security_events');
```

You should see all 3 tables listed.

### Step 3: Deploy the Updated Code

The following files have been updated and need to be deployed:

- ✅ `src/services/security.service.ts` - Now uses Supabase
- ✅ `src/pages/Login.tsx` - Updated to use async security methods
- ✅ `src/pages/AdminLogin.tsx` - Updated to use async security methods

**Deploy to Vercel:**

```bash
git add .
git commit -m "feat: Migrate security system to Supabase remote storage"
git push
```

Vercel will automatically deploy the changes.

### Step 4: Test the Security System

1. **Test Failed Login Attempts:**
   - Go to your login page
   - Try logging in with wrong password 5 times
   - On the 5th attempt, account should be locked for 30 minutes

2. **Verify in Database:**
   ```sql
   -- View rate limits
   SELECT * FROM public.rate_limits;

   -- View login attempts
   SELECT * FROM public.login_attempts ORDER BY timestamp DESC LIMIT 10;

   -- View security events
   SELECT * FROM public.security_events ORDER BY timestamp DESC LIMIT 10;
   ```

3. **Test Account Unlock:**
   ```sql
   -- Manually unlock an account
   UPDATE public.rate_limits
   SET locked_until = NULL, attempt_count = 0
   WHERE email = 'test@example.com';
   ```

---

## 🔐 Security Features

### 1. Rate Limiting
- **Max Attempts:** 5 failed logins per email
- **Time Window:** 15 minutes
- **Lockout Duration:** 30 minutes after 5 failed attempts
- **Storage:** Supabase `rate_limits` table

### 2. Progressive Delays
- **1st failure:** 2 second delay
- **2nd failure:** 4 second delay
- **3rd failure:** 6 second delay
- **4th failure:** 8 second delay
- **5th failure:** 10 second delay + account lock

### 3. Login Attempt Tracking
- Every login attempt is logged (success/fail)
- Includes timestamp, email, user agent
- Stored in `login_attempts` table
- Automatically cleaned up after 30 days

### 4. Security Event Logging
- Logs suspicious activities
- Logs account lockouts
- Logs account unlocks
- Stored in `security_events` table
- Automatically cleaned up after 90 days

### 5. Input Validation & Sanitization
- Email format validation
- XSS prevention (removes `<>`, `javascript:`, event handlers)
- Email normalization (lowercase)

---

## 🛠️ Admin Functions

### View Locked Accounts

```typescript
const lockedAccounts = await securityService.getLockedAccounts();
console.log(lockedAccounts);
```

### Unlock an Account

```typescript
await securityService.unlockAccount('user@example.com');
```

### View Recent Security Events

```typescript
const events = await securityService.getRecentSecurityEvents(50);
console.log(events);
```

### Get Security Report for User

```typescript
const report = await securityService.getSecurityReport('user@example.com');
console.log(report);
// {
//   isLocked: false,
//   remainingAttempts: 3,
//   lockoutMinutes: 0,
//   recentAttempts: 2
// }
```

### Clear Security Data (Testing Only)

```typescript
await securityService.clearSecurityData('test@example.com');
```

---

## 📊 Database Maintenance

### Automatic Cleanup Functions

The SQL migration includes cleanup functions that should be run periodically:

```sql
-- Clean up old login attempts (older than 30 days)
SELECT cleanup_old_login_attempts();

-- Clean up old security events (older than 90 days)
SELECT cleanup_old_security_events();

-- Reset expired rate limits
SELECT reset_expired_rate_limits();
```

### Setting Up Automatic Cleanup (Optional)

You can use Supabase Edge Functions or a cron job to run these automatically:

1. Go to Supabase Dashboard → Database → Functions
2. Create a scheduled function to run daily:

```sql
-- Run this daily
SELECT cleanup_old_login_attempts();
SELECT cleanup_old_security_events();
SELECT reset_expired_rate_limits();
```

---

## 🔍 Monitoring & Analytics

### View Failed Login Attempts (Last 24 Hours)

```sql
SELECT
  email,
  COUNT(*) as attempts,
  MAX(timestamp) as last_attempt
FROM public.login_attempts
WHERE
  success = false
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY email
ORDER BY attempts DESC;
```

### View Currently Locked Accounts

```sql
SELECT
  email,
  attempt_count,
  locked_until,
  ROUND(EXTRACT(EPOCH FROM (locked_until - NOW())) / 60) as minutes_remaining
FROM public.rate_limits
WHERE
  locked_until IS NOT NULL
  AND locked_until > NOW()
ORDER BY locked_until DESC;
```

### View Security Events by Type

```sql
SELECT
  event_type,
  COUNT(*) as count,
  MAX(timestamp) as last_occurrence
FROM public.security_events
GROUP BY event_type
ORDER BY count DESC;
```

### Identify Suspicious Activity

```sql
SELECT
  email,
  COUNT(*) as attempts,
  MIN(timestamp) as first_attempt,
  MAX(timestamp) as last_attempt,
  ROUND(EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) / 60) as time_span_minutes
FROM public.login_attempts
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY email
HAVING COUNT(*) > 10
ORDER BY attempts DESC;
```

---

## 🚨 Troubleshooting

### Issue: "Table does not exist" error

**Solution:** Run the SQL migration again:
```bash
# Make sure you ran supabase/CREATE_LOGIN_SECURITY_TABLE.sql
```

### Issue: "Permission denied" error

**Solution:** Check RLS policies are correctly applied:
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('login_attempts', 'rate_limits', 'security_events');
```

### Issue: Rate limiting not working

**Solution:** Check if data is being written:
```sql
-- Check if login attempts are being recorded
SELECT * FROM public.login_attempts ORDER BY timestamp DESC LIMIT 5;

-- Check rate limits table
SELECT * FROM public.rate_limits;
```

### Issue: Users can't login (false lockouts)

**Solution:** Clear rate limits:
```sql
-- Clear all rate limits (testing only)
DELETE FROM public.rate_limits;
```

---

## 📈 Performance Considerations

### Indexes

The migration automatically creates indexes on:
- `login_attempts(email)`
- `login_attempts(timestamp)`
- `rate_limits(locked_until)`
- `security_events(email, timestamp)`

### Query Performance

All security checks use indexed queries:
- Lockout checks: ~5-10ms
- Rate limit checks: ~5-10ms
- Login attempt logging: ~10-20ms

### Database Size

Estimated growth:
- **Login attempts:** ~100 bytes/record × ~1000/month = ~100 KB/month
- **Rate limits:** ~50 bytes/record × ~50 active = ~2.5 KB
- **Security events:** ~200 bytes/record × ~100/month = ~20 KB/month

**Total:** ~120 KB/month (negligible)

With automatic cleanup:
- Login attempts kept for 30 days
- Security events kept for 90 days

---

## 🔐 Security Best Practices

1. **Regular Monitoring:**
   - Review security events weekly
   - Check for unusual patterns
   - Monitor locked accounts

2. **Incident Response:**
   - Investigate accounts with multiple lockouts
   - Review suspicious activity logs
   - Update security policies as needed

3. **Data Retention:**
   - Run cleanup functions monthly
   - Archive important security events
   - Keep audit trail for compliance

4. **Access Control:**
   - Only admins can view security data
   - Service role has full access
   - Anonymous users can only insert attempts

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Supabase logs in Dashboard → Logs
3. Check browser console for client-side errors
4. Verify database tables exist and have data

---

## ✅ Deployment Checklist

- [ ] Backup current database
- [ ] Run SQL migration in Supabase
- [ ] Verify tables created successfully
- [ ] Deploy updated code to Vercel
- [ ] Test failed login attempts (5 times)
- [ ] Verify account lockout works
- [ ] Check data appears in database tables
- [ ] Test account unlock functionality
- [ ] Verify security events are logged
- [ ] Set up monitoring queries
- [ ] Schedule cleanup functions (optional)
- [ ] Update security documentation
- [ ] Train admins on new features

---

**Last Updated:** November 27, 2025
**Version:** 2.1.0 - Remote Storage Security
