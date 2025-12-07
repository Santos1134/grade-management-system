
CREATE POLICY authenticated_insert_login_attempts ON public.login_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY authenticated_manage_rate_limits ON public.rate_limits
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY authenticated_insert_security_events ON public.security_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('login_attempts', 'rate_limits', 'security_events')
ORDER BY tablename, policyname;
