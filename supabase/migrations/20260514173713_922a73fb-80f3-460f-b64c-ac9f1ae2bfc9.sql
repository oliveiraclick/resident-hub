ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS entregador TEXT;
ALTER TABLE public.pacotes ADD COLUMN IF NOT EXISTS localizacao TEXT;
ALTER TABLE public.pacotes ADD COLUMN IF NOT EXISTS codigo_rastreio TEXT;

CREATE INDEX IF NOT EXISTS idx_pacotes_codigo_rastreio ON public.pacotes(codigo_rastreio);
CREATE INDEX IF NOT EXISTS idx_pacotes_status ON public.pacotes(status);