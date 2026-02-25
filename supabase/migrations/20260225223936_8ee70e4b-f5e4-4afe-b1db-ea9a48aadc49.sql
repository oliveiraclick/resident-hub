
CREATE OR REPLACE FUNCTION public.get_condominio_morador_counts()
RETURNS TABLE(condominio_id uuid, total bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT ur.condominio_id, COUNT(*)::bigint AS total
  FROM public.user_roles ur
  WHERE ur.role = 'morador'
  AND ur.condominio_id IS NOT NULL
  GROUP BY ur.condominio_id;
$$;
