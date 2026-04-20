-- Add link from banners back to the paid request
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS solicitacao_id uuid;
CREATE INDEX IF NOT EXISTS idx_banners_solicitacao ON public.banners(solicitacao_id);

-- Trigger: sync banner_solicitacoes status -> banners
CREATE OR REPLACE FUNCTION public.sync_solicitacao_to_banner()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _prestador_nome text;
  _existing_banner_id uuid;
BEGIN
  -- Only act on status changes (or first activation)
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Find existing banner tied to this solicitação (if any)
  SELECT id INTO _existing_banner_id FROM public.banners WHERE solicitacao_id = NEW.id LIMIT 1;

  IF NEW.status = 'ativo' THEN
    -- Get prestador name for title
    SELECT COALESCE(pr.nome, 'Anúncio') INTO _prestador_nome
    FROM public.prestadores p
    LEFT JOIN public.profiles pr ON pr.user_id = p.user_id
    WHERE p.id = NEW.prestador_id LIMIT 1;

    IF _existing_banner_id IS NULL THEN
      -- Create published banner
      INSERT INTO public.banners (condominio_id, titulo, imagem_url, ativo, ordem, publico, solicitacao_id)
      VALUES (NEW.condominio_id, COALESCE(_prestador_nome, 'Anúncio'), NEW.imagem_url, true, 0, 'morador', NEW.id);
    ELSE
      -- Re-activate existing
      UPDATE public.banners SET ativo = true, imagem_url = NEW.imagem_url WHERE id = _existing_banner_id;
    END IF;
  ELSIF NEW.status IN ('rejeitado', 'expirado', 'pendente', 'aprovado') AND _existing_banner_id IS NOT NULL THEN
    -- Any non-active state hides the banner
    UPDATE public.banners SET ativo = false WHERE id = _existing_banner_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_solicitacao_to_banner ON public.banner_solicitacoes;
CREATE TRIGGER trg_sync_solicitacao_to_banner
AFTER INSERT OR UPDATE ON public.banner_solicitacoes
FOR EACH ROW EXECUTE FUNCTION public.sync_solicitacao_to_banner();