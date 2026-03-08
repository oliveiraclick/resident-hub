
-- Categorias do cardápio (ex: Lanches, Bebidas, Sobremesas)
CREATE TABLE public.cardapio_categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cardapio_categorias ENABLE ROW LEVEL SECURITY;

-- Itens do cardápio
CREATE TABLE public.cardapio_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES public.cardapio_categorias(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC,
  imagem_url TEXT,
  disponivel BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cardapio_itens ENABLE ROW LEVEL SECURITY;

-- Horários de funcionamento do food truck (dias da semana)
CREATE TABLE public.cardapio_horarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loja_id UUID NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL, -- 0=Domingo, 1=Segunda...6=Sábado
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cardapio_horarios ENABLE ROW LEVEL SECURITY;

-- Add cardapio_ativo flag to lojas
ALTER TABLE public.lojas ADD COLUMN cardapio_ativo BOOLEAN NOT NULL DEFAULT false;

-- RLS: cardapio_categorias
CREATE POLICY "Prestador can manage own cardapio_categorias"
  ON public.cardapio_categorias FOR ALL TO authenticated
  USING (loja_id IN (SELECT l.id FROM lojas l JOIN prestadores p ON p.id = l.prestador_id WHERE p.user_id = auth.uid()))
  WITH CHECK (loja_id IN (SELECT l.id FROM lojas l JOIN prestadores p ON p.id = l.prestador_id WHERE p.user_id = auth.uid()));

CREATE POLICY "Members can view cardapio_categorias"
  ON public.cardapio_categorias FOR SELECT TO authenticated
  USING (loja_id IN (SELECT id FROM lojas WHERE ativa = true));

-- RLS: cardapio_itens
CREATE POLICY "Prestador can manage own cardapio_itens"
  ON public.cardapio_itens FOR ALL TO authenticated
  USING (loja_id IN (SELECT l.id FROM lojas l JOIN prestadores p ON p.id = l.prestador_id WHERE p.user_id = auth.uid()))
  WITH CHECK (loja_id IN (SELECT l.id FROM lojas l JOIN prestadores p ON p.id = l.prestador_id WHERE p.user_id = auth.uid()));

CREATE POLICY "Members can view cardapio_itens"
  ON public.cardapio_itens FOR SELECT TO authenticated
  USING (loja_id IN (SELECT id FROM lojas WHERE ativa = true));

-- RLS: cardapio_horarios
CREATE POLICY "Prestador can manage own cardapio_horarios"
  ON public.cardapio_horarios FOR ALL TO authenticated
  USING (loja_id IN (SELECT l.id FROM lojas l JOIN prestadores p ON p.id = l.prestador_id WHERE p.user_id = auth.uid()))
  WITH CHECK (loja_id IN (SELECT l.id FROM lojas l JOIN prestadores p ON p.id = l.prestador_id WHERE p.user_id = auth.uid()));

CREATE POLICY "Members can view cardapio_horarios"
  ON public.cardapio_horarios FOR SELECT TO authenticated
  USING (loja_id IN (SELECT id FROM lojas WHERE ativa = true));
