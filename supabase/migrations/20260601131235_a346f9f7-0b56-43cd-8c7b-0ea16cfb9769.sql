-- Add columns to app_configs for PIX info
-- Assuming app_configs table exists as used in useAppTheme
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_configs' AND column_name='pix_key') THEN
        ALTER TABLE public.app_configs ADD COLUMN pix_key TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_configs' AND column_name='pix_name') THEN
        ALTER TABLE public.app_configs ADD COLUMN pix_name TEXT;
    END IF;
END $$;
