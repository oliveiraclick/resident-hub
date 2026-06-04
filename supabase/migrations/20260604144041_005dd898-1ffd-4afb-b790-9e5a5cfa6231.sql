ALTER TABLE public.copa_jogos ADD COLUMN IF NOT EXISTS time_home_logo_url TEXT;
ALTER TABLE public.copa_jogos ADD COLUMN IF NOT EXISTS time_away_logo_url TEXT;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.copa_jogos TO authenticated;
GRANT ALL ON public.copa_jogos TO service_role;