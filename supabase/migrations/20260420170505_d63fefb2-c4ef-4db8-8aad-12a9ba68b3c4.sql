-- Trigger function to notify provider via edge function when a new rating is created
CREATE OR REPLACE FUNCTION public.notify_nova_avaliacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _avaliador_nome text;
  _supabase_url text;
  _service_key text;
BEGIN
  -- Get evaluator name
  SELECT COALESCE(nome, 'Um morador') INTO _avaliador_nome
  FROM public.profiles
  WHERE user_id = NEW.avaliador_id
  LIMIT 1;

  -- Read Vault secrets (set via Supabase dashboard if available; fallback to settings)
  BEGIN
    _supabase_url := current_setting('app.settings.supabase_url', true);
    _service_key := current_setting('app.settings.service_role_key', true);
  EXCEPTION WHEN OTHERS THEN
    _supabase_url := NULL;
  END;

  -- Use pg_net to call the edge function asynchronously
  PERFORM net.http_post(
    url := 'https://qfprslmwsuetqabexwkf.supabase.co/functions/v1/notify-avaliacao',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(_service_key, current_setting('supabase.service_role_key', true), '')
    ),
    body := jsonb_build_object(
      'avaliado_id', NEW.avaliado_id,
      'avaliador_nome', _avaliador_nome,
      'nota', NEW.nota,
      'comentario', NEW.comentario
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Don't block insert if push fails
  RETURN NEW;
END;
$$;

-- Ensure pg_net extension is available
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DROP TRIGGER IF EXISTS trg_notify_nova_avaliacao ON public.avaliacoes;
CREATE TRIGGER trg_notify_nova_avaliacao
AFTER INSERT ON public.avaliacoes
FOR EACH ROW
EXECUTE FUNCTION public.notify_nova_avaliacao();