
-- Tabela de categorias de notícias gerenciada pelo Super Admin
CREATE TABLE public.noticias_categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  emoji TEXT NOT NULL DEFAULT '📰',
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.noticias_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view noticias_categorias"
  ON public.noticias_categorias FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Platform admins can manage noticias_categorias"
  ON public.noticias_categorias FOR ALL
  TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- Inserir categorias iniciais
INSERT INTO public.noticias_categorias (nome, emoji, ordem) VALUES
  ('Futebol', '⚽', 1),
  ('Fórmula 1', '🏎️', 2),
  ('Games', '🎮', 3),
  ('Tecnologia', '💻', 4),
  ('Moda', '👗', 5),
  ('Estética & Beleza', '💅', 6),
  ('Saúde & Bem-estar', '🧘', 7),
  ('Culinária', '🍳', 8),
  ('Filmes & Séries', '🎬', 9),
  ('Finanças', '💰', 10);
