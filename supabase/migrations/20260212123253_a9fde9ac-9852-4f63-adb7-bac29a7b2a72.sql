
-- Adicionar campos ao pacotes para suportar fluxo de encomendas
ALTER TABLE public.pacotes
  ADD COLUMN IF NOT EXISTS qr_code TEXT,
  ADD COLUMN IF NOT EXISTS morador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lote_id UUID REFERENCES public.lotes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS retirado_em TIMESTAMPTZ;

-- Atualizar status padrão
ALTER TABLE public.pacotes ALTER COLUMN status SET DEFAULT 'RECEBIDO';

-- Adicionar campos ao lotes
ALTER TABLE public.lotes
  ADD COLUMN IF NOT EXISTS quantidade_itens INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_recebimento TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.lotes ALTER COLUMN status SET DEFAULT 'RECEBIDO';
