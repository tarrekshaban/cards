-- Set is_admin metadata for admin user
-- This updates the user_metadata field in the auth.users table

UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"is_admin": true}'::jsonb
WHERE email = 'tarrek.shaban@gmail.com';
