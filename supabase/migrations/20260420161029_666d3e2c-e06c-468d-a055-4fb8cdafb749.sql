-- Tabela para registrar quando um morador solicita serviço a um prestador (clica no WhatsApp)
CREATE TABLE IF NOT EXISTS public.solicitacoes_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  morador_id uuid NOT NULL,
  prestador_user_id uuid NOT NULL,
  condominio_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (morador_id, prestador_user_id)
);

ALTER TABLE public.solicitacoes_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Morador can insert own solicitacoes"
ON public.solicitacoes_servico
FOR INSERT
TO authenticated
WITH CHECK (morador_id = auth.uid() AND belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Morador can view own solicitacoes"
ON public.solicitacoes_servico
FOR SELECT
TO authenticated
USING (morador_id = auth.uid());

CREATE POLICY "Prestador can view solicitacoes for self"
ON public.solicitacoes_servico
FOR SELECT
TO authenticated
USING (prestador_user_id = auth.uid());

CREATE POLICY "Platform admin full solicitacoes"
ON public.solicitacoes_servico
FOR ALL
TO authenticated
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

-- Garantir 1 avaliação por par avaliador→avaliado (para permitir substituição via upsert)
-- Remover duplicatas existentes mantendo a mais recente
DELETE FROM public.avaliacoes a
USING public.avaliacoes b
WHERE a.avaliador_id = b.avaliador_id
  AND a.avaliado_id = b.avaliado_id
  AND a.created_at < b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS uq_avaliacoes_avaliador_avaliado
ON public.avaliacoes (avaliador_id, avaliado_id);