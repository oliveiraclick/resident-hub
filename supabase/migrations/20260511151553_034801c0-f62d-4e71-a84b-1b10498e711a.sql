ALTER TABLE public.espacos ADD COLUMN IF NOT EXISTS categoria TEXT;

-- Opcional: Criar um índice para melhorar a performance das consultas por categoria
CREATE INDEX IF NOT EXISTS idx_espacos_categoria ON public.espacos(categoria);