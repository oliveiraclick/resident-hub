CREATE TABLE IF NOT EXISTS public.copa_selecoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.copa_selecoes TO authenticated;
GRANT ALL ON public.copa_selecoes TO service_role;
ALTER TABLE public.copa_selecoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for all" ON public.copa_selecoes FOR SELECT USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.copa_selecoes FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.copa_selecoes (nome, status) VALUES
('Argentina', 'ativo'), ('França', 'ativo'), ('Brasil', 'ativo'), ('Inglaterra', 'ativo'), 
('Bélgica', 'ativo'), ('Espanha', 'ativo'), ('Portugal', 'ativo'), ('Holanda', 'ativo'),
('Itália', 'ativo'), ('Alemanha', 'ativo'), ('Uruguai', 'ativo'), ('Croácia', 'ativo'), 
('EUA', 'ativo'), ('México', 'ativo'), ('Marrocos', 'ativo'), ('Senegal', 'ativo'),
('Japão', 'ativo'), ('Coréia do Sul', 'ativo'), ('Austrália', 'ativo'), ('Canadá', 'ativo'), 
('Colômbia', 'ativo'), ('Equador', 'ativo'), ('Suíça', 'ativo'), ('Dinamarca', 'ativo')
ON CONFLICT (nome) DO NOTHING;