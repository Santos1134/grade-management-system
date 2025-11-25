-- Update admin email in profiles table
UPDATE public.profiles
SET email = 'sumomarky@gmail.com'
WHERE id = '84e42646-593c-4ea6-80a4-ec7a26a7993a';

-- Note: To update the password and email in Supabase Auth:
-- 1. Go to Supabase Dashboard
-- 2. Click "Authentication" in the left sidebar
-- 3. Click "Users"
-- 4. Find the user with email "admin@spchs.edu" or ID "84e42646-593c-4ea6-80a4-ec7a26a7993a"
-- 5. Click on the user
-- 6. Update Email to: sumomarky@gmail.com
-- 7. Update Password to: Sumo1234
-- 8. Click "Save"

-- Alternatively, if you have the service role key, you can use the Supabase Admin API
-- But that requires service role privileges which the anon key doesn't have.
