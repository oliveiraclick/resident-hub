
-- 1) Coluna de expiração para pré-reservas
ALTER TABLE public.reservas
  ADD COLUMN IF NOT EXISTS expira_em timestamptz;

-- 2) Índice de apoio
CREATE INDEX IF NOT EXISTS idx_reservas_status_data ON public.reservas (espaco_id, data, status);

-- 3) Limpa pré-reservas expiradas (chamada pelo backend antes de checar conflito)
CREATE OR REPLACE FUNCTION public.expirar_pre_reservas()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.reservas
   WHERE status = 'pre_reserva'
     AND expira_em IS NOT NULL
     AND expira_em < now();
$$;

-- 4) Localiza morador pelo telefone (uso da IA via edge function)
CREATE OR REPLACE FUNCTION public.find_morador_by_phone(_telefone text, _condominio_id uuid)
RETURNS TABLE(user_id uuid, nome text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.nome
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE ur.role = 'morador'
    AND ur.aprovado = true
    AND ur.condominio_id = _condominio_id
    AND regexp_replace(coalesce(p.telefone,''), '\D', '', 'g')
        = regexp_replace(coalesce(_telefone,''), '\D', '', 'g')
    AND regexp_replace(coalesce(p.telefone,''), '\D', '', 'g') <> ''
  LIMIT 1;
$$;
