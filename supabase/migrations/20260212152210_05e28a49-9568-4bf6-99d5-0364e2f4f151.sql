
-- Step 1: Add platform_admin to enum and allow NULL condominio_id
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'platform_admin';
ALTER TABLE public.user_roles ALTER COLUMN condominio_id DROP NOT NULL;
