-- Add valor_aposta column to app_configs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_configs' AND column_name='valor_aposta') THEN
        ALTER TABLE public.app_configs ADD COLUMN valor_aposta NUMERIC DEFAULT 10;
    END IF;
END $$;
