-- 1) Tabela de auditoria
CREATE TABLE public.banner_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_tipo text NOT NULL CHECK (banner_tipo IN ('institucional', 'solicitacao')),
  banner_id uuid NOT NULL,
  condominio_id uuid,
  acao text NOT NULL, -- criado, ativado, desativado, aprovado, rejeitado, expirado, atualizado
  status_anterior text,
  status_novo text,
  ator_user_id uuid,
  ator_nome text,
  detalhes jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_banner_audit_banner ON public.banner_audit_log(banner_tipo, banner_id, created_at DESC);
CREATE INDEX idx_banner_audit_condominio ON public.banner_audit_log(condominio_id, created_at DESC);

ALTER TABLE public.banner_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view banner audit log"
ON public.banner_audit_log FOR SELECT
USING (
  is_platform_admin(auth.uid())
  OR (condominio_id IS NOT NULL AND has_role(auth.uid(), condominio_id, 'admin'::app_role))
);

CREATE POLICY "System can insert audit log"
ON public.banner_audit_log FOR INSERT
WITH CHECK (true);

-- 2) Função utilitária para pegar nome do ator
CREATE OR REPLACE FUNCTION public._get_ator_nome(_user_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(nome, 'Sistema') FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

-- 3) Trigger para tabela banners (institucionais)
CREATE OR REPLACE FUNCTION public.audit_banners()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _ator uuid := auth.uid();
  _nome text := COALESCE(public._get_ator_nome(auth.uid()), 'Sistema');
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.banner_audit_log(banner_tipo, banner_id, condominio_id, acao, status_novo, ator_user_id, ator_nome, detalhes)
    VALUES ('institucional', NEW.id, NEW.condominio_id,
      CASE WHEN NEW.ativo THEN 'criado_e_ativado' ELSE 'criado' END,
      CASE WHEN NEW.ativo THEN 'ativo' ELSE 'inativo' END,
      _ator, _nome,
      jsonb_build_object('titulo', NEW.titulo, 'publico', NEW.publico));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.ativo IS DISTINCT FROM OLD.ativo THEN
      INSERT INTO public.banner_audit_log(banner_tipo, banner_id, condominio_id, acao, status_anterior, status_novo, ator_user_id, ator_nome, detalhes)
      VALUES ('institucional', NEW.id, NEW.condominio_id,
        CASE WHEN NEW.ativo THEN 'ativado' ELSE 'desativado' END,
        CASE WHEN OLD.ativo THEN 'ativo' ELSE 'inativo' END,
        CASE WHEN NEW.ativo THEN 'ativo' ELSE 'inativo' END,
        _ator, _nome,
        jsonb_build_object('titulo', NEW.titulo));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_banners
AFTER INSERT OR UPDATE ON public.banners
FOR EACH ROW EXECUTE FUNCTION public.audit_banners();

-- 4) Trigger para banner_solicitacoes (pagos)
CREATE OR REPLACE FUNCTION public.audit_banner_solicitacoes()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _ator uuid := auth.uid();
  _nome text := COALESCE(public._get_ator_nome(auth.uid()), 'Sistema');
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.banner_audit_log(banner_tipo, banner_id, condominio_id, acao, status_novo, ator_user_id, ator_nome, detalhes)
    VALUES ('solicitacao', NEW.id, NEW.condominio_id, 'criado', NEW.status, _ator, _nome,
      jsonb_build_object('prestador_id', NEW.prestador_id, 'tipo_arte', NEW.tipo_arte, 'valor_total', NEW.valor_total));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.banner_audit_log(banner_tipo, banner_id, condominio_id, acao, status_anterior, status_novo, ator_user_id, ator_nome, detalhes)
    VALUES ('solicitacao', NEW.id, NEW.condominio_id, NEW.status, OLD.status, NEW.status, _ator, _nome,
      jsonb_build_object('prestador_id', NEW.prestador_id));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_audit_banner_solicitacoes
AFTER INSERT OR UPDATE ON public.banner_solicitacoes
FOR EACH ROW EXECUTE FUNCTION public.audit_banner_solicitacoes();

-- 5) Função RPC para buscar a última ação relevante de cada banner (usada na UI)
CREATE OR REPLACE FUNCTION public.get_banner_last_actions(_banner_tipo text, _banner_ids uuid[])
RETURNS TABLE(banner_id uuid, acao text, ator_nome text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT ON (banner_id) banner_id, acao, ator_nome, created_at
  FROM public.banner_audit_log
  WHERE banner_tipo = _banner_tipo
    AND banner_id = ANY(_banner_ids)
    AND acao IN ('ativado', 'criado_e_ativado', 'aprovado', 'ativo', 'desativado', 'rejeitado', 'expirado')
  ORDER BY banner_id, created_at DESC;
$$;