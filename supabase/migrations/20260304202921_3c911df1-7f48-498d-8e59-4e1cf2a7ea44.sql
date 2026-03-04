
-- Cotação: request sent by morador to all prestadores of a category
CREATE TABLE public.evento_cotacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid REFERENCES public.eventos_amigos(id) ON DELETE CASCADE NOT NULL,
  condominio_id uuid REFERENCES public.condominios(id) ON DELETE CASCADE NOT NULL,
  criador_id uuid NOT NULL,
  categoria text NOT NULL,
  data_evento date NOT NULL,
  horario_inicio time NOT NULL,
  horario_fim time NOT NULL,
  qtd_pessoas integer NOT NULL DEFAULT 10,
  tipo_servico text NOT NULL DEFAULT 'completo',
  observacoes text,
  status text NOT NULL DEFAULT 'aberta',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.evento_cotacoes ENABLE ROW LEVEL SECURITY;

-- Creator can do everything with own cotacoes
CREATE POLICY "Criador pode inserir cotacao"
  ON public.evento_cotacoes FOR INSERT
  WITH CHECK (criador_id = auth.uid() AND belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Criador pode ver cotacao"
  ON public.evento_cotacoes FOR SELECT
  USING (criador_id = auth.uid() OR is_platform_admin(auth.uid()));

CREATE POLICY "Criador pode atualizar cotacao"
  ON public.evento_cotacoes FOR UPDATE
  USING (criador_id = auth.uid());

CREATE POLICY "Criador pode deletar cotacao"
  ON public.evento_cotacoes FOR DELETE
  USING (criador_id = auth.uid());

-- Prestadores in same condominio can view cotacoes (to respond)
CREATE POLICY "Prestador pode ver cotacoes do condominio"
  ON public.evento_cotacoes FOR SELECT
  USING (belongs_to_condominio(auth.uid(), condominio_id));

-- Cotação responses from prestadores
CREATE TABLE public.evento_cotacao_respostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotacao_id uuid REFERENCES public.evento_cotacoes(id) ON DELETE CASCADE NOT NULL,
  prestador_id uuid REFERENCES public.prestadores(id) ON DELETE CASCADE NOT NULL,
  valor numeric NOT NULL,
  mensagem text,
  disponivel boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.evento_cotacao_respostas ENABLE ROW LEVEL SECURITY;

-- Prestador can insert own response
CREATE POLICY "Prestador pode responder cotacao"
  ON public.evento_cotacao_respostas FOR INSERT
  WITH CHECK (prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid()));

-- Prestador can view own responses
CREATE POLICY "Prestador pode ver proprias respostas"
  ON public.evento_cotacao_respostas FOR SELECT
  USING (prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid()));

-- Prestador can update own response
CREATE POLICY "Prestador pode atualizar propria resposta"
  ON public.evento_cotacao_respostas FOR UPDATE
  USING (prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid()));

-- Creator of the cotação can view all responses
CREATE POLICY "Criador pode ver respostas"
  ON public.evento_cotacao_respostas FOR SELECT
  USING (cotacao_id IN (SELECT id FROM public.evento_cotacoes WHERE criador_id = auth.uid()));

-- Creator can update response status (aceitar/recusar)
CREATE POLICY "Criador pode atualizar status resposta"
  ON public.evento_cotacao_respostas FOR UPDATE
  USING (cotacao_id IN (SELECT id FROM public.evento_cotacoes WHERE criador_id = auth.uid()));

-- Platform admin access
CREATE POLICY "Platform admin full cotacoes"
  ON public.evento_cotacoes FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admin full respostas"
  ON public.evento_cotacao_respostas FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));
