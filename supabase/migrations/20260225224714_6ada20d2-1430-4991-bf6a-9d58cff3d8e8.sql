
ALTER TABLE public.banners
ADD COLUMN publico text NOT NULL DEFAULT 'morador';
-- publico: 'morador', 'prestador', 'todos'

COMMENT ON COLUMN public.banners.publico IS 'Público-alvo do banner: morador, prestador ou todos';
