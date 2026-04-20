-- 1. Tabela de configuração de preço (chave Pix global)
CREATE TABLE IF NOT EXISTS public.prestador_precos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  valor_mensal_condominio_extra numeric NOT NULL DEFAULT 49.90,
  trial_dias integer NOT NULL DEFAULT 60,
  chave_pix text,
  tipo_chave_pix text DEFAULT 'cpf',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prestador_precos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view prestador_precos" ON public.prestador_precos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Platform admins manage prestador_precos" ON public.prestador_precos FOR ALL USING (is_platform_admin(auth.uid())) WITH CHECK (is_platform_admin(auth.uid()));
INSERT INTO public.prestador_precos (id) VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING;

-- 2. Tabela de vínculos prestador <-> condomínio (multi-tenant)
CREATE TABLE IF NOT EXISTS public.prestador_condominios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_user_id uuid NOT NULL,
  condominio_id uuid NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pendente_pagamento', -- 'trial' | 'ativo' | 'pendente_pagamento' | 'expirado' | 'cancelado'
  is_primeiro boolean NOT NULL DEFAULT false,
  trial_inicio timestamptz,
  trial_fim timestamptz,
  pagamento_status text, -- 'aguardando' | 'pago' | 'rejeitado'
  pagamento_comprovante_url text,
  pagamento_aprovado_em timestamptz,
  pagamento_aprovado_por uuid,
  valor_mensal numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prestador_user_id, condominio_id)
);
CREATE INDEX IF NOT EXISTS idx_prest_cond_user ON public.prestador_condominios(prestador_user_id);
CREATE INDEX IF NOT EXISTS idx_prest_cond_status ON public.prestador_condominios(status);

ALTER TABLE public.prestador_condominios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Prestador view own vinculos" ON public.prestador_condominios FOR SELECT
  USING (prestador_user_id = auth.uid() OR is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'::app_role));
CREATE POLICY "Prestador create own vinculo" ON public.prestador_condominios FOR INSERT
  WITH CHECK (prestador_user_id = auth.uid() OR is_platform_admin(auth.uid()));
CREATE POLICY "Prestador update own pagamento" ON public.prestador_condominios FOR UPDATE
  USING (prestador_user_id = auth.uid() OR is_platform_admin(auth.uid()));
CREATE POLICY "Platform admin delete vinculo" ON public.prestador_condominios FOR DELETE
  USING (is_platform_admin(auth.uid()));

-- 3. Função: verifica se prestador é elegível a trial (não duplicar email/empresa/telefone)
CREATE OR REPLACE FUNCTION public.is_trial_eligible(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _email text;
  _telefone text;
  _nome text;
  _existe boolean;
BEGIN
  -- Super admin sempre pode (sem trial, mas sem bloqueio)
  IF is_platform_admin(_user_id) THEN RETURN true; END IF;

  SELECT u.email, p.telefone, p.nome
  INTO _email, _telefone, _nome
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE u.id = _user_id;

  -- Verifica se existe outro prestador (com vínculo trial/ativo) com mesmo email, telefone ou nome
  SELECT EXISTS (
    SELECT 1
    FROM public.prestador_condominios pc
    JOIN auth.users u2 ON u2.id = pc.prestador_user_id
    LEFT JOIN public.profiles p2 ON p2.user_id = pc.prestador_user_id
    WHERE pc.prestador_user_id <> _user_id
      AND pc.status IN ('trial', 'ativo')
      AND (
        lower(u2.email) = lower(_email)
        OR (_telefone IS NOT NULL AND _telefone <> '' AND p2.telefone = _telefone)
        OR (_nome IS NOT NULL AND _nome <> '' AND lower(p2.nome) = lower(_nome))
      )
  ) INTO _existe;

  RETURN NOT _existe;
END;
$$;

-- 4. Trigger: ao inserir vínculo, define automaticamente trial vs pendente_pagamento
CREATE OR REPLACE FUNCTION public.handle_prestador_condominio_insert()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _ja_tem_vinculo boolean;
  _eligivel boolean;
  _trial_dias integer;
  _valor numeric;
BEGIN
  -- Super admin: sempre ativo, sem cobrança
  IF is_platform_admin(NEW.prestador_user_id) THEN
    NEW.status := 'ativo';
    NEW.is_primeiro := false;
    NEW.valor_mensal := 0;
    RETURN NEW;
  END IF;

  SELECT trial_dias, valor_mensal_condominio_extra INTO _trial_dias, _valor FROM public.prestador_precos LIMIT 1;
  _trial_dias := COALESCE(_trial_dias, 60);
  _valor := COALESCE(_valor, 49.90);

  SELECT EXISTS (
    SELECT 1 FROM public.prestador_condominios
    WHERE prestador_user_id = NEW.prestador_user_id
      AND status IN ('trial', 'ativo', 'pendente_pagamento')
  ) INTO _ja_tem_vinculo;

  IF _ja_tem_vinculo THEN
    -- Já tem vínculo: este é extra, exige pagamento imediato
    NEW.is_primeiro := false;
    NEW.status := 'pendente_pagamento';
    NEW.valor_mensal := _valor;
    NEW.pagamento_status := 'aguardando';
  ELSE
    -- Primeiro vínculo: checa elegibilidade trial
    _eligivel := public.is_trial_eligible(NEW.prestador_user_id);
    IF _eligivel THEN
      NEW.is_primeiro := true;
      NEW.status := 'trial';
      NEW.trial_inicio := now();
      NEW.trial_fim := now() + (_trial_dias || ' days')::interval;
      NEW.valor_mensal := 0;
    ELSE
      -- Não elegível (dado duplicado): cobra direto
      NEW.is_primeiro := true;
      NEW.status := 'pendente_pagamento';
      NEW.valor_mensal := _valor;
      NEW.pagamento_status := 'aguardando';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_prestador_condominio_insert ON public.prestador_condominios;
CREATE TRIGGER trg_handle_prestador_condominio_insert
BEFORE INSERT ON public.prestador_condominios
FOR EACH ROW EXECUTE FUNCTION public.handle_prestador_condominio_insert();

-- 5. Trigger: quando Master aprova pagamento, ativa
CREATE OR REPLACE FUNCTION public.handle_pagamento_aprovado()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.pagamento_status = 'pago' AND OLD.pagamento_status IS DISTINCT FROM 'pago' THEN
    NEW.status := 'ativo';
    NEW.pagamento_aprovado_em := now();
    NEW.pagamento_aprovado_por := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_pagamento_aprovado ON public.prestador_condominios;
CREATE TRIGGER trg_handle_pagamento_aprovado
BEFORE UPDATE ON public.prestador_condominios
FOR EACH ROW EXECUTE FUNCTION public.handle_pagamento_aprovado();