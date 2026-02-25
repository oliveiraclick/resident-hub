
-- Tabela de indicações entre prestadores
CREATE TABLE public.indicacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_id uuid NOT NULL,  -- user_id de quem indicou
  indicado_id uuid NOT NULL,   -- user_id de quem foi indicado
  status text NOT NULL DEFAULT 'pendente', -- pendente, confirmada, usada
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(indicado_id) -- cada pessoa só pode ser indicada por uma
);

ALTER TABLE public.indicacoes ENABLE ROW LEVEL SECURITY;

-- Platform admin acesso total
CREATE POLICY "Platform admin full access indicacoes"
ON public.indicacoes FOR ALL TO authenticated
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

-- Prestador pode ver suas indicações (feitas por ele)
CREATE POLICY "Prestador can view own indicacoes"
ON public.indicacoes FOR SELECT TO authenticated
USING (indicador_id = auth.uid());

-- Qualquer autenticado pode inserir (no momento do cadastro)
CREATE POLICY "Anyone can insert indicacao"
ON public.indicacoes FOR INSERT TO authenticated
WITH CHECK (indicado_id = auth.uid());
