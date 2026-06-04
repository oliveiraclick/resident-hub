ALTER TABLE public.copa_selecoes ADD COLUMN IF NOT EXISTS logo_url TEXT;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.copa_selecoes TO authenticated;
GRANT ALL ON public.copa_selecoes TO service_role;