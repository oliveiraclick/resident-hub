
DROP FUNCTION IF EXISTS public.get_prestador_profiles(uuid[]);

CREATE FUNCTION public.get_prestador_profiles(_user_ids uuid[])
RETURNS TABLE(user_id uuid, nome text, avatar_url text, telefone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.user_id, p.nome, p.avatar_url, p.telefone
  FROM public.profiles p
  WHERE p.user_id = ANY(_user_ids)
    AND p.user_id IN (SELECT pr.user_id FROM public.prestadores pr);
$$;
