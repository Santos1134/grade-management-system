-- Just insert into admins table (profile already exists)
INSERT INTO public.admins (id)
VALUES ('84e42646-593c-4ea6-80a4-ec7a26a7993a')
ON CONFLICT (id) DO NOTHING;

-- Update profile to have admin role
UPDATE public.profiles
SET role = 'admin', name = 'Administrator'
WHERE id = '84e42646-593c-4ea6-80a4-ec7a26a7993a';
