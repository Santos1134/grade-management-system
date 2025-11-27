/**
 * Security Service - Remote Storage Implementation
 * Provides server-side security measures including login tracking,
 * input validation, and attack detection using Supabase
 *
 * NOTE: Account lockout disabled - only tracking login attempts
 */

import { supabase } from '../lib/supabase';

interface LoginAttempt {
  email: string;
  timestamp: number;
  success: boolean;
  ip_address?: string;
  user_agent?: string;
}

interface SecurityEvent {
  email: string;
  event_type: string;
  details?: Record<string, any>;
  ip_address?: string;
}

class SecurityService {
  /**
   * Record a login attempt (success or failure)
   */
  async recordLoginAttempt(identifier: string, success: boolean): Promise<void> {
    try {
      const email = identifier.toLowerCase();
      const now = new Date().toISOString();

      // Insert login attempt record
      await supabase.from('login_attempts').insert({
        email,
        success,
        timestamp: now,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
      });

      // Log failed attempts as security events
      if (!success) {
        await this.logSecurityEvent({
          email,
          event_type: 'FAILED_LOGIN',
          details: {
            timestamp: now,
          },
        });
      }
    } catch (error) {
      console.error('[Security] Error recording login attempt:', error);
    }
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Detect suspicious patterns in login attempts
   */
  async detectSuspiciousActivity(identifier: string): Promise<boolean> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('email', identifier.toLowerCase())
        .gte('timestamp', fiveMinutesAgo);

      if (error || !data) return false;

      // Flag if more than 10 attempts in 5 minutes
      if (data.length > 10) {
        await this.logSecurityEvent({
          email: identifier.toLowerCase(),
          event_type: 'SUSPICIOUS_ACTIVITY',
          details: {
            reason: 'Too many login attempts in short time',
            attempt_count: data.length,
            time_window: '5 minutes',
          },
        });

        console.warn('[Security] Suspicious activity detected: Too many login attempts');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[Security] Error detecting suspicious activity:', error);
      return false;
    }
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await supabase.from('security_events').insert({
        email: event.email.toLowerCase(),
        event_type: event.event_type,
        details: event.details || {},
        ip_address: await this.getClientIP(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[Security] Error logging security event:', error);
    }
  }

  /**
   * Clear all security data for an email (for testing or admin purposes)
   */
  async clearSecurityData(email: string): Promise<void> {
    try {
      const normalizedEmail = email.toLowerCase();

      await Promise.all([
        supabase.from('login_attempts').delete().eq('email', normalizedEmail),
        supabase.from('security_events').delete().eq('email', normalizedEmail),
      ]);

      console.log(`[Security] Cleared security data for ${email}`);
    } catch (error) {
      console.error('[Security] Error clearing security data:', error);
    }
  }

  /**
   * Get security report for identifier
   */
  async getSecurityReport(identifier: string): Promise<{
    recentAttempts: number;
    recentFailures: number;
    lastAttempt: string | null;
  }> {
    try {
      const email = identifier.toLowerCase();
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

      const { data: attempts } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('email', email)
        .gte('timestamp', fifteenMinutesAgo)
        .order('timestamp', { ascending: false });

      const failures = attempts?.filter(a => !a.success).length || 0;
      const lastAttempt = attempts?.[0]?.timestamp || null;

      return {
        recentAttempts: attempts?.length || 0,
        recentFailures: failures,
        lastAttempt,
      };
    } catch (error) {
      console.error('[Security] Error getting security report:', error);
      return {
        recentAttempts: 0,
        recentFailures: 0,
        lastAttempt: null,
      };
    }
  }

  /**
   * Get client IP address (best effort)
   */
  private async getClientIP(): Promise<string | undefined> {
    try {
      // This is a best-effort approach - in production you might use a service
      // or rely on server-side logging for accurate IP tracking
      return 'client-side'; // Placeholder - actual IP should be logged server-side
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Admin function: Get recent security events
   */
  async getRecentSecurityEvents(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[Security] Error fetching security events:', error);
      return [];
    }
  }

  /**
   * Admin function: Get failed login attempts
   */
  async getFailedLoginAttempts(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('success', false)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[Security] Error fetching failed logins:', error);
      return [];
    }
  }

  /**
   * Admin function: Get login statistics
   */
  async getLoginStatistics(email?: string): Promise<{
    totalAttempts: number;
    successfulLogins: number;
    failedLogins: number;
  }> {
    try {
      let query = supabase
        .from('login_attempts')
        .select('*');

      if (email) {
        query = query.eq('email', email.toLowerCase());
      }

      const { data, error } = await query;

      if (error) throw error;

      const total = data?.length || 0;
      const successful = data?.filter(a => a.success).length || 0;
      const failed = data?.filter(a => !a.success).length || 0;

      return {
        totalAttempts: total,
        successfulLogins: successful,
        failedLogins: failed,
      };
    } catch (error) {
      console.error('[Security] Error getting login statistics:', error);
      return {
        totalAttempts: 0,
        successfulLogins: 0,
        failedLogins: 0,
      };
    }
  }
}

export const securityService = new SecurityService();
