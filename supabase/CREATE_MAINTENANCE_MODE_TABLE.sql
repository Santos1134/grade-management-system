-- Create maintenance_mode table to control student access during grade updates
-- This allows admins to temporarily block student logins while grades are being entered

CREATE TABLE IF NOT EXISTS public.maintenance_mode (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  message TEXT DEFAULT 'Grades input is in progress. Please try again later.',
  enabled_by UUID REFERENCES auth.users(id),
  enabled_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial record
INSERT INTO public.maintenance_mode (is_enabled)
VALUES (FALSE)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.maintenance_mode ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read maintenance mode status
CREATE POLICY "Anyone can read maintenance mode"
  ON public.maintenance_mode
  FOR SELECT
  USING (true);

-- Policy: Only admins can update maintenance mode
CREATE POLICY "Only admins can update maintenance mode"
  ON public.maintenance_mode
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_maintenance_mode_is_enabled ON public.maintenance_mode(is_enabled);

-- Add comment
COMMENT ON TABLE public.maintenance_mode IS 'Controls whether students can log in during grade updates';
