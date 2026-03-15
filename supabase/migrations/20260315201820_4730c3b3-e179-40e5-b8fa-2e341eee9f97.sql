
-- Tabela de notícias geradas por IA
CREATE TABLE public.noticias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria TEXT NOT NULL,
  titulo TEXT NOT NULL,
  resumo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  imagem_emoji TEXT NOT NULL DEFAULT '📰',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de interesses do morador
CREATE TABLE public.morador_interesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  categoria TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, categoria)
);

-- RLS para noticias (leitura pública para autenticados)
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view noticias"
  ON public.noticias FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Platform admins can manage noticias"
  ON public.noticias FOR ALL
  TO authenticated
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- RLS para morador_interesses
ALTER TABLE public.morador_interesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own interesses"
  ON public.morador_interesses FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
