-- Enable Realtime for maintenance_mode table
-- This allows the app to receive real-time notifications when maintenance mode is toggled

-- Enable realtime replication for the maintenance_mode table
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_mode;

-- Verify realtime is enabled
-- You can check this in Supabase Dashboard: Database > Replication
-- The maintenance_mode table should appear in the list of replicated tables
