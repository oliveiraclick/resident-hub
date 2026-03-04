
-- Function to get profiles for Entre Amigos participants
CREATE OR REPLACE FUNCTION public.get_evento_participant_profiles(_user_ids uuid[])
RETURNS TABLE(user_id uuid, nome text, avatar_url text, telefone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.nome, p.avatar_url, p.telefone
  FROM public.profiles p
  WHERE p.user_id = ANY(_user_ids);
$$;

-- Function to list moradores from same condominio for inviting
CREATE OR REPLACE FUNCTION public.get_condominio_moradores(_condominio_id uuid)
RETURNS TABLE(user_id uuid, nome text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.nome, p.avatar_url
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE ur.condominio_id = _condominio_id
    AND ur.role = 'morador'
    AND ur.aprovado = true
    AND p.user_id != auth.uid()
    AND belongs_to_condominio(auth.uid(), _condominio_id)
  ORDER BY p.nome;
$$;
