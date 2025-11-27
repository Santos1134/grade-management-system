# Security Policy and Best Practices

This document outlines the security measures implemented in the Grade Management System and best practices for maintaining system security.

## 🔒 Implemented Security Features

### 1. **Authentication Security**

#### Rate Limiting & Account Lockout
- **Failed Login Attempts**: Maximum 5 failed attempts per account within 15 minutes
- **Progressive Delays**: Increasing delay after each failed attempt (2s, 4s, 6s, etc.)
- **Account Lockout**: 30-minute lockout after 5 failed attempts
- **Automatic Reset**: Lockout automatically clears after the timeout period

#### Input Validation & Sanitization
- **Email Validation**: Strict email format validation
- **Input Sanitization**: Removal of XSS-prone characters (`<>`, `javascript:`, event handlers)
- **Trimming**: Automatic whitespace removal from credentials
- **Case Normalization**: Email addresses converted to lowercase

### 2. **Session Management**

#### Student Session Timeout
- **Inactivity Timeout**: Automatic logout after 20 minutes of inactivity
- **Activity Tracking**: Monitors mouse movement, keyboard input, clicks, scrolling, touch events
- **Automatic Reset**: Timer resets on any user activity

#### Session Security
- **Supabase Auth**: Industry-standard JWT-based authentication
- **Secure Storage**: Auth tokens stored securely in browser
- **Auto-refresh**: Tokens automatically refreshed before expiration

### 3. **Access Control**

#### Role-Based Access
- **Student Role**: View grades, rankings, and notifications only
- **Sponsor Role**: Manage grades for assigned grade/section
- **Admin Role**: Full system access including user management

#### Hidden Admin Login
- **Obscured URL**: Admin login accessible only via `/admin` route
- **No Public Links**: Admin option removed from main login page
- **Security by Obscurity**: Additional layer of protection

### 4. **HTTP Security Headers**

Configured in `vercel.json`:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: [Strict CSP rules]
```

#### What These Headers Do:
- **X-Content-Type-Options**: Prevents MIME-type sniffing attacks
- **X-Frame-Options**: Prevents clickjacking by blocking iframe embedding
- **X-XSS-Protection**: Enables browser XSS filter
- **Referrer-Policy**: Controls information sent in referrer header
- **Permissions-Policy**: Disables unnecessary browser features
- **Content-Security-Policy**: Restricts resource loading to trusted sources

### 5. **Database Security**

#### Row Level Security (RLS)
- **Enabled on all tables**: Users can only access their own data
- **Role-based policies**: Different access rules for students, sponsors, admins
- **Automatic enforcement**: Supabase enforces policies at database level

#### Data Validation
- **Grade validation**: 0-100 range enforcement
- **Required fields**: Student ID, grade level enforcement
- **Cascade deletes**: Proper cleanup on user deletion

## 🛡️ Security Best Practices

### For Administrators

1. **Strong Passwords**
   - Minimum 8 characters
   - Include uppercase, lowercase, numbers, and special characters
   - Never share or write down passwords
   - Change passwords quarterly

2. **Admin Access**
   - Only share `/admin` URL with trusted administrators
   - Monitor admin activity through audit logs
   - Regularly review user accounts

3. **Maintenance Mode**
   - Enable during grade updates to prevent student access
   - Communicate planned maintenance to users
   - Disable immediately after completion

4. **User Management**
   - Remove unused accounts promptly
   - Review user roles regularly
   - Use password reset feature instead of sharing passwords

### For All Users

1. **Login Security**
   - Never share login credentials
   - Log out when finished
   - Report suspicious activity immediately
   - Use unique passwords (don't reuse)

2. **Browser Security**
   - Keep browser updated
   - Clear cache periodically
   - Don't save passwords in public computers
   - Log out on shared devices

3. **Data Privacy**
   - Don't share grade information
   - Report data discrepancies
   - Verify recipient before sending sensitive data

## 🚨 Security Incident Response

### If You Suspect a Security Issue:

1. **Immediate Actions**
   - Change your password immediately
   - Log out from all sessions
   - Document what happened

2. **Report To**
   - System Administrator
   - Include: Date, time, what happened, what you saw

3. **Don't**
   - Don't try to "test" the vulnerability
   - Don't share the issue publicly
   - Don't delete evidence

## 🔍 Security Monitoring

### Automated Monitoring

- **Login attempt tracking**: All failed logins are logged
- **Activity timestamps**: Last login times tracked
- **Suspicious patterns**: Automated detection of unusual activity
- **Session tracking**: Active session monitoring

### Admin Tools

Administrators can:
- View audit logs (who changed what grades and when)
- Monitor login attempts
- Review security reports
- Track user activity

## 📋 Security Checklist

### Weekly
- [ ] Review recent login attempts
- [ ] Check for locked accounts
- [ ] Verify active user list

### Monthly
- [ ] Review audit logs for anomalies
- [ ] Check for dormant accounts
- [ ] Update admin passwords
- [ ] Review grade modification patterns

### Quarterly
- [ ] Full security audit
- [ ] Review and update access policies
- [ ] Test backup and recovery procedures
- [ ] Update security documentation

## 🔐 Technical Security Details

### Client-Side Security
- **Input validation**: All user inputs sanitized before processing
- **XSS Prevention**: Removes dangerous characters and patterns
- **Email validation**: Format validation before submission

### Server-Side Security (Supabase)
- **Authentication**: JWT tokens with automatic refresh
- **Authorization**: Row Level Security policies
- **Rate limiting**: Implemented in Supabase database (cannot be bypassed)
- **Login tracking**: All attempts logged in `login_attempts` table
- **Account lockout**: Automatic 30-minute lockout after 5 failed attempts
- **Security events**: Suspicious activity logged in `security_events` table
- **Encryption**: All data encrypted in transit (HTTPS) and at rest
- **Backups**: Automatic daily backups

### Network Security
- **HTTPS Only**: All connections encrypted
- **CORS**: Configured for Supabase domain only
- **No exposed APIs**: All API calls authenticated
- **Rate limiting**: Supabase provides built-in rate limiting

## 📞 Security Contact

For security concerns or to report vulnerabilities:
- Contact your system administrator
- Do not publicly disclose security issues

## 📝 Security Updates

### Version History
- **v2.1.0** (2025-11-27): Migrated to remote storage security
  - Server-side rate limiting in Supabase (bypasses client-side vulnerabilities)
  - Login attempt tracking in database
  - Security event logging system
  - Admin security monitoring tools
  - Automatic data cleanup functions
- **v2.0.0** (2025-11-27): Added comprehensive security features
  - Rate limiting and account lockout
  - Input sanitization
  - Security headers
  - Session timeout for students
  - Hidden admin login

---

**Last Updated**: November 27, 2025
**Review Frequency**: Quarterly
**Next Review**: February 27, 2026
