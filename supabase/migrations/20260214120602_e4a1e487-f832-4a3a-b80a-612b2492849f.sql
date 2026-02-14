
ALTER TABLE public.prestadores 
ADD COLUMN IF NOT EXISTS visivel boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS visivel_ate timestamp with time zone;
