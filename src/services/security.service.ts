/**
 * Security Service - Remote Storage Implementation
 * Provides server-side security measures including rate limiting,
 * input validation, and attack detection using Supabase
 */

import { supabase } from '../lib/supabase';

interface LoginAttempt {
  email: string;
  timestamp: number;
  success: boolean;
  ip_address?: string;
  user_agent?: string;
}

interface RateLimitEntry {
  email: string;
  attempt_count: number;
  first_attempt_at: string;
  last_attempt_at: string;
  locked_until?: string;
}

interface SecurityEvent {
  email: string;
  event_type: string;
  details?: Record<string, any>;
  ip_address?: string;
}

class SecurityService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private readonly LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
  private readonly PROGRESSIVE_DELAY_MS = 2000; // 2 second delay after failed attempt

  /**
   * Check if user is currently locked out
   */
  async isLockedOut(identifier: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('rate_limits')
        .select('locked_until')
        .eq('email', identifier.toLowerCase())
        .single();

      if (error || !data || !data.locked_until) return false;

      const lockedUntil = new Date(data.locked_until).getTime();
      const now = Date.now();

      if (now < lockedUntil) {
        return true;
      }

      // Lockout expired, clear it
      await supabase
        .from('rate_limits')
        .update({ locked_until: null, attempt_count: 0 })
        .eq('email', identifier.toLowerCase());

      return false;
    } catch (error) {
      console.error('[Security] Error checking lockout status:', error);
      return false;
    }
  }

  /**
   * Get remaining lockout time in minutes
   */
  async getLockoutTimeRemaining(identifier: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('rate_limits')
        .select('locked_until')
        .eq('email', identifier.toLowerCase())
        .single();

      if (error || !data || !data.locked_until) return 0;

      const remaining = new Date(data.locked_until).getTime() - Date.now();
      return Math.ceil(remaining / 60000); // Convert to minutes
    } catch (error) {
      console.error('[Security] Error getting lockout time:', error);
      return 0;
    }
  }

  /**
   * Record a login attempt
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

      if (success) {
        // Clear rate limit on successful login
        await supabase
          .from('rate_limits')
          .delete()
          .eq('email', email);
      } else {
        // Handle failed attempt
        await this.handleFailedAttempt(email, now);
      }
    } catch (error) {
      console.error('[Security] Error recording login attempt:', error);
    }
  }

  /**
   * Handle failed login attempt - update rate limits
   */
  private async handleFailedAttempt(email: string, timestamp: string): Promise<void> {
    try {
      // Get current rate limit entry
      const { data: existing } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('email', email)
        .single();

      if (!existing) {
        // Create new rate limit entry
        await supabase.from('rate_limits').insert({
          email,
          attempt_count: 1,
          first_attempt_at: timestamp,
          last_attempt_at: timestamp,
        });
      } else {
        // Check if window has expired (15 minutes)
        const firstAttemptTime = new Date(existing.first_attempt_at).getTime();
        const now = new Date(timestamp).getTime();

        let newCount = existing.attempt_count + 1;
        let firstAttempt = existing.first_attempt_at;

        // Reset window if expired
        if (now - firstAttemptTime > this.WINDOW_MS) {
          newCount = 1;
          firstAttempt = timestamp;
        }

        // Check if should lock account
        let lockedUntil = existing.locked_until;
        if (newCount >= this.MAX_ATTEMPTS) {
          lockedUntil = new Date(now + this.LOCKOUT_DURATION_MS).toISOString();

          // Log security event
          await this.logSecurityEvent({
            email,
            event_type: 'ACCOUNT_LOCKED',
            details: {
              reason: 'Too many failed login attempts',
              attempt_count: newCount,
            },
          });

          console.warn(`[Security] Account ${email} locked due to ${this.MAX_ATTEMPTS} failed login attempts`);
        }

        // Update rate limit entry
        await supabase
          .from('rate_limits')
          .update({
            attempt_count: newCount,
            first_attempt_at: firstAttempt,
            last_attempt_at: timestamp,
            locked_until: lockedUntil,
          })
          .eq('email', email);
      }
    } catch (error) {
      console.error('[Security] Error handling failed attempt:', error);
    }
  }

  /**
   * Check if rate limit is exceeded (before lockout)
   */
  async isRateLimited(identifier: string): Promise<boolean> {
    if (await this.isLockedOut(identifier)) return true;

    try {
      const { data } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('email', identifier.toLowerCase())
        .single();

      if (!data) return false;

      const now = Date.now();
      const firstAttemptTime = new Date(data.first_attempt_at).getTime();

      // Reset if window expired
      if (now - firstAttemptTime > this.WINDOW_MS) {
        await supabase
          .from('rate_limits')
          .delete()
          .eq('email', identifier.toLowerCase());
        return false;
      }

      return data.attempt_count >= this.MAX_ATTEMPTS;
    } catch (error) {
      console.error('[Security] Error checking rate limit:', error);
      return false;
    }
  }

  /**
   * Get number of remaining attempts
   */
  async getRemainingAttempts(identifier: string): Promise<number> {
    try {
      const { data } = await supabase
        .from('rate_limits')
        .select('*')
        .eq('email', identifier.toLowerCase())
        .single();

      if (!data) return this.MAX_ATTEMPTS;

      const now = Date.now();
      const firstAttemptTime = new Date(data.first_attempt_at).getTime();

      // Reset if window expired
      if (now - firstAttemptTime > this.WINDOW_MS) {
        return this.MAX_ATTEMPTS;
      }

      return Math.max(0, this.MAX_ATTEMPTS - data.attempt_count);
    } catch (error) {
      console.error('[Security] Error getting remaining attempts:', error);
      return this.MAX_ATTEMPTS;
    }
  }

  /**
   * Apply progressive delay after failed login
   */
  async applyProgressiveDelay(identifier: string): Promise<void> {
    try {
      const { data } = await supabase
        .from('rate_limits')
        .select('attempt_count')
        .eq('email', identifier.toLowerCase())
        .single();

      if (!data || data.attempt_count === 0) return;

      // Progressive delay: increases with each failed attempt
      const delay = Math.min(data.attempt_count * this.PROGRESSIVE_DELAY_MS, 10000);

      console.log(`[Security] Applying ${delay}ms delay after failed attempt`);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      console.error('[Security] Error applying progressive delay:', error);
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
        supabase.from('rate_limits').delete().eq('email', normalizedEmail),
        supabase.from('login_attempts').delete().eq('email', normalizedEmail),
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
    isLocked: boolean;
    remainingAttempts: number;
    lockoutMinutes: number;
    recentAttempts: number;
  }> {
    try {
      const email = identifier.toLowerCase();
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

      const { data: attempts } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('email', email)
        .gte('timestamp', fifteenMinutesAgo);

      return {
        isLocked: await this.isLockedOut(email),
        remainingAttempts: await this.getRemainingAttempts(email),
        lockoutMinutes: await this.getLockoutTimeRemaining(email),
        recentAttempts: attempts?.length || 0,
      };
    } catch (error) {
      console.error('[Security] Error getting security report:', error);
      return {
        isLocked: false,
        remainingAttempts: this.MAX_ATTEMPTS,
        lockoutMinutes: 0,
        recentAttempts: 0,
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
   * Admin function: Get locked accounts
   */
  async getLockedAccounts(): Promise<RateLimitEntry[]> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('rate_limits')
        .select('*')
        .not('locked_until', 'is', null)
        .gte('locked_until', now);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[Security] Error fetching locked accounts:', error);
      return [];
    }
  }

  /**
   * Admin function: Unlock an account
   */
  async unlockAccount(email: string): Promise<boolean> {
    try {
      await supabase
        .from('rate_limits')
        .update({ locked_until: null, attempt_count: 0 })
        .eq('email', email.toLowerCase());

      await this.logSecurityEvent({
        email: email.toLowerCase(),
        event_type: 'ACCOUNT_UNLOCKED',
        details: { unlocked_by: 'admin' },
      });

      console.log(`[Security] Account ${email} unlocked by admin`);
      return true;
    } catch (error) {
      console.error('[Security] Error unlocking account:', error);
      return false;
    }
  }
}

export const securityService = new SecurityService();
