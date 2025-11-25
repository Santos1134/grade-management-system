-- Create a function to delete auth users when profiles are deleted
-- This uses the service role to delete from auth.users

-- First, create a function that will be triggered before profile deletion
CREATE OR REPLACE FUNCTION public.delete_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to run with elevated privileges
AS $$
BEGIN
  -- Delete the user from auth.users
  -- Note: This requires the function to be created by a user with service role access
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

-- Create a trigger that fires BEFORE a profile is deleted
DROP TRIGGER IF EXISTS on_profile_delete ON public.profiles;

CREATE TRIGGER on_profile_delete
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_auth_user();

-- IMPORTANT NOTES:
-- 1. This trigger will automatically delete the user from auth.users when a profile is deleted
-- 2. The function uses SECURITY DEFINER to run with elevated privileges
-- 3. This allows deletion from auth.users even without service role key in frontend
-- 4. The cascade will still work: profiles -> students/sponsors/admins
-- 5. Now when you delete a student, both profile AND auth user are removed
-- 6. This allows you to recreate a user with the same email

-- To verify the trigger was created:
SELECT tgname, tgtype, tgenabled
FROM pg_trigger
WHERE tgrelid = 'public.profiles'::regclass;
