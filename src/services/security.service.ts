/**
 * Security Service
 * Provides client-side security measures including rate limiting,
 * input validation, and attack detection
 */

interface LoginAttempt {
  email: string;
  timestamp: number;
  success: boolean;
}

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil?: number;
}

class SecurityService {
  private readonly STORAGE_KEY = 'security_login_attempts';
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private readonly LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
  private readonly PROGRESSIVE_DELAY_MS = 2000; // 2 second delay after failed attempt

  /**
   * Check if user is currently locked out
   */
  isLockedOut(identifier: string): boolean {
    const rateLimits = this.getRateLimits();
    const entry = rateLimits[identifier];

    if (!entry || !entry.lockedUntil) return false;

    if (Date.now() < entry.lockedUntil) {
      return true;
    }

    // Lockout expired, clear it
    delete entry.lockedUntil;
    this.saveRateLimits(rateLimits);
    return false;
  }

  /**
   * Get remaining lockout time in minutes
   */
  getLockoutTimeRemaining(identifier: string): number {
    const rateLimits = this.getRateLimits();
    const entry = rateLimits[identifier];

    if (!entry || !entry.lockedUntil) return 0;

    const remaining = entry.lockedUntil - Date.now();
    return Math.ceil(remaining / 60000); // Convert to minutes
  }

  /**
   * Record a login attempt
   */
  recordLoginAttempt(identifier: string, success: boolean): void {
    const rateLimits = this.getRateLimits();
    const now = Date.now();

    if (!rateLimits[identifier]) {
      rateLimits[identifier] = {
        count: 0,
        firstAttempt: now,
        lastAttempt: now,
      };
    }

    const entry = rateLimits[identifier];

    // Reset counter if window has passed
    if (now - entry.firstAttempt > this.WINDOW_MS) {
      entry.count = 0;
      entry.firstAttempt = now;
    }

    if (success) {
      // Clear attempts on successful login
      delete rateLimits[identifier];
    } else {
      // Increment failed attempts
      entry.count++;
      entry.lastAttempt = now;

      // Lock account if max attempts reached
      if (entry.count >= this.MAX_ATTEMPTS) {
        entry.lockedUntil = now + this.LOCKOUT_DURATION_MS;
        console.warn(`[Security] Account locked due to ${this.MAX_ATTEMPTS} failed login attempts`);
      }
    }

    this.saveRateLimits(rateLimits);

    // Store attempt history
    this.addLoginAttemptHistory({
      email: identifier,
      timestamp: now,
      success,
    });
  }

  /**
   * Check if rate limit is exceeded (before lockout)
   */
  isRateLimited(identifier: string): boolean {
    if (this.isLockedOut(identifier)) return true;

    const rateLimits = this.getRateLimits();
    const entry = rateLimits[identifier];

    if (!entry) return false;

    const now = Date.now();

    // Reset if window expired
    if (now - entry.firstAttempt > this.WINDOW_MS) {
      delete rateLimits[identifier];
      this.saveRateLimits(rateLimits);
      return false;
    }

    return entry.count >= this.MAX_ATTEMPTS;
  }

  /**
   * Get number of remaining attempts
   */
  getRemainingAttempts(identifier: string): number {
    const rateLimits = this.getRateLimits();
    const entry = rateLimits[identifier];

    if (!entry) return this.MAX_ATTEMPTS;

    const now = Date.now();

    // Reset if window expired
    if (now - entry.firstAttempt > this.WINDOW_MS) {
      return this.MAX_ATTEMPTS;
    }

    return Math.max(0, this.MAX_ATTEMPTS - entry.count);
  }

  /**
   * Apply progressive delay after failed login
   */
  async applyProgressiveDelay(identifier: string): Promise<void> {
    const rateLimits = this.getRateLimits();
    const entry = rateLimits[identifier];

    if (!entry || entry.count === 0) return;

    // Progressive delay: increases with each failed attempt
    const delay = Math.min(entry.count * this.PROGRESSIVE_DELAY_MS, 10000);

    console.log(`[Security] Applying ${delay}ms delay after failed attempt`);
    await new Promise(resolve => setTimeout(resolve, delay));
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
  detectSuspiciousActivity(identifier: string): boolean {
    const history = this.getLoginAttemptHistory();
    const recentAttempts = history.filter(
      attempt =>
        attempt.email === identifier &&
        Date.now() - attempt.timestamp < 5 * 60 * 1000 // Last 5 minutes
    );

    // Flag if more than 10 attempts in 5 minutes
    if (recentAttempts.length > 10) {
      console.warn('[Security] Suspicious activity detected: Too many login attempts');
      return true;
    }

    return false;
  }

  /**
   * Clear all security data (for testing or admin purposes)
   */
  clearSecurityData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(`${this.STORAGE_KEY}_history`);
  }

  /**
   * Get security report for identifier
   */
  getSecurityReport(identifier: string): {
    isLocked: boolean;
    remainingAttempts: number;
    lockoutMinutes: number;
    recentAttempts: number;
  } {
    const history = this.getLoginAttemptHistory();
    const recentAttempts = history.filter(
      attempt =>
        attempt.email === identifier &&
        Date.now() - attempt.timestamp < 15 * 60 * 1000
    ).length;

    return {
      isLocked: this.isLockedOut(identifier),
      remainingAttempts: this.getRemainingAttempts(identifier),
      lockoutMinutes: this.getLockoutTimeRemaining(identifier),
      recentAttempts,
    };
  }

  // Private helper methods

  private getRateLimits(): Record<string, RateLimitEntry> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private saveRateLimits(rateLimits: Record<string, RateLimitEntry>): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(rateLimits));
    } catch (error) {
      console.error('[Security] Failed to save rate limits:', error);
    }
  }

  private getLoginAttemptHistory(): LoginAttempt[] {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY}_history`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private addLoginAttemptHistory(attempt: LoginAttempt): void {
    try {
      const history = this.getLoginAttemptHistory();

      // Keep only last 100 attempts
      history.push(attempt);
      if (history.length > 100) {
        history.shift();
      }

      localStorage.setItem(`${this.STORAGE_KEY}_history`, JSON.stringify(history));
    } catch (error) {
      console.error('[Security] Failed to save login attempt history:', error);
    }
  }
}

export const securityService = new SecurityService();
