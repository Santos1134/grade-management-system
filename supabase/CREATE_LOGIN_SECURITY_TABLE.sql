-- =====================================================
-- LOGIN SECURITY TABLES
-- St. Peter Claver Catholic High School
-- =====================================================
-- This script creates tables for tracking login attempts,
-- rate limiting, and security events in the database

-- Login attempts tracking table
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Rate limiting tracking table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  email TEXT PRIMARY KEY,
  attempt_count INTEGER DEFAULT 0,
  first_attempt_at TIMESTAMPTZ NOT NULL,
  last_attempt_at TIMESTAMPTZ NOT NULL,
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security events log (for monitoring suspicious activity)
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'SUSPICIOUS_ACTIVITY', 'ACCOUNT_LOCKED', 'BRUTE_FORCE_DETECTED', etc.
  details JSONB,
  ip_address TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_login_attempts_email
  ON public.login_attempts(email);

CREATE INDEX IF NOT EXISTS idx_login_attempts_timestamp
  ON public.login_attempts(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_login_attempts_success
  ON public.login_attempts(success);

CREATE INDEX IF NOT EXISTS idx_rate_limits_locked_until
  ON public.rate_limits(locked_until)
  WHERE locked_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_security_events_email
  ON public.security_events(email);

CREATE INDEX IF NOT EXISTS idx_security_events_timestamp
  ON public.security_events(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_type
  ON public.security_events(event_type);

-- =====================================================
-- AUTOMATIC CLEANUP FUNCTIONS
-- =====================================================

-- Function to clean up old login attempts (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.login_attempts
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old security events (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_security_events()
RETURNS void AS $$
BEGIN
  DELETE FROM public.security_events
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset expired rate limits
CREATE OR REPLACE FUNCTION reset_expired_rate_limits()
RETURNS void AS $$
BEGIN
  -- Reset lockouts that have expired
  UPDATE public.rate_limits
  SET
    locked_until = NULL,
    attempt_count = 0,
    updated_at = NOW()
  WHERE locked_until IS NOT NULL
    AND locked_until < NOW();

  -- Reset rate limit windows that have expired (15 minutes)
  DELETE FROM public.rate_limits
  WHERE locked_until IS NULL
    AND last_attempt_at < NOW() - INTERVAL '15 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all security tables
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all security data
CREATE POLICY admin_view_login_attempts ON public.login_attempts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY admin_view_rate_limits ON public.rate_limits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY admin_view_security_events ON public.security_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE admins.id = auth.uid()
    )
  );

-- Policy: Service role can insert/update/delete (for security service)
CREATE POLICY service_manage_login_attempts ON public.login_attempts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY service_manage_rate_limits ON public.rate_limits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY service_manage_security_events ON public.security_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Anonymous users can insert login attempts (before auth)
-- This is needed because login attempts happen before authentication
CREATE POLICY anon_insert_login_attempts ON public.login_attempts
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY anon_manage_rate_limits ON public.rate_limits
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY anon_insert_security_events ON public.security_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- =====================================================
-- SCHEDULED CLEANUP (Run these periodically)
-- =====================================================

-- You can set up a cron job or run these manually periodically:
-- SELECT cleanup_old_login_attempts();
-- SELECT cleanup_old_security_events();
-- SELECT reset_expired_rate_limits();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.login_attempts IS 'Tracks all login attempts for security monitoring and auditing';
COMMENT ON TABLE public.rate_limits IS 'Tracks rate limiting state per email address';
COMMENT ON TABLE public.security_events IS 'Logs security-related events for monitoring and alerting';

COMMENT ON COLUMN public.login_attempts.success IS 'Whether the login attempt was successful';
COMMENT ON COLUMN public.rate_limits.locked_until IS 'Timestamp until which the account is locked (NULL if not locked)';
COMMENT ON COLUMN public.security_events.event_type IS 'Type of security event (SUSPICIOUS_ACTIVITY, ACCOUNT_LOCKED, etc.)';

-- =====================================================
-- TESTING QUERIES
-- =====================================================

-- View recent failed login attempts
-- SELECT * FROM public.login_attempts WHERE success = false ORDER BY timestamp DESC LIMIT 20;

-- View currently locked accounts
-- SELECT * FROM public.rate_limits WHERE locked_until IS NOT NULL AND locked_until > NOW();

-- View security events
-- SELECT * FROM public.security_events ORDER BY timestamp DESC LIMIT 50;
