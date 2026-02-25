
-- Tabela de assinaturas dos prestadores
CREATE TABLE public.assinaturas_prestador (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  condominio_id uuid NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'trial',
  -- status: trial, ativa, cancelada, expirada
  trial_inicio timestamp with time zone DEFAULT now(),
  trial_fim timestamp with time zone,
  -- null = sem expiração (liberado)
  kiwify_subscription_id text,
  kiwify_customer_id text,
  valor_mensal numeric NOT NULL DEFAULT 29.90,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(prestador_id, condominio_id)
);

-- RLS
ALTER TABLE public.assinaturas_prestador ENABLE ROW LEVEL SECURITY;

-- Platform admins podem tudo
CREATE POLICY "Platform admins full access"
ON public.assinaturas_prestador
FOR ALL
TO authenticated
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

-- Prestador pode ver suas próprias assinaturas
CREATE POLICY "Prestador can view own assinaturas"
ON public.assinaturas_prestador
FOR SELECT
TO authenticated
USING (
  prestador_id IN (
    SELECT id FROM public.prestadores WHERE user_id = auth.uid()
  )
);

-- Admin do condomínio pode ver assinaturas do condomínio
CREATE POLICY "Admin can view condominio assinaturas"
ON public.assinaturas_prestador
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), condominio_id, 'admin'::app_role)
);

-- Inserir assinatura para prestadores existentes (trial sem expiração)
INSERT INTO public.assinaturas_prestador (prestador_id, condominio_id, status, trial_inicio, trial_fim, valor_mensal)
SELECT p.id, p.condominio_id, 'trial', now(), null, 29.90
FROM public.prestadores p
ON CONFLICT (prestador_id, condominio_id) DO NOTHING;
