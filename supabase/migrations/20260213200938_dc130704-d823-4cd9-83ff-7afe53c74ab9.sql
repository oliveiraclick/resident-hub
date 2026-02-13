
CREATE OR REPLACE FUNCTION public.get_desapego_owner_profile(_user_id uuid)
RETURNS TABLE(user_id uuid, nome text, avatar_url text, telefone text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.user_id, p.nome, p.avatar_url, p.telefone
  FROM public.profiles p
  WHERE p.user_id = _user_id
  LIMIT 1;
$$;
