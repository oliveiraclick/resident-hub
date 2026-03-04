CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.search_prestadores_by_especialidade(_condominio_id uuid, _term text)
RETURNS TABLE(id uuid, especialidade text, user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id, p.especialidade, p.user_id
  FROM public.prestadores p
  WHERE p.condominio_id = _condominio_id
    AND unaccent(lower(p.especialidade)) LIKE '%' || unaccent(lower(_term)) || '%'
  LIMIT 5;
$$;