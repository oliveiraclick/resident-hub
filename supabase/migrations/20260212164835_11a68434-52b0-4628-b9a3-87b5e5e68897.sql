
-- Drop the view approach (won't work with security_invoker + RLS)
DROP VIEW IF EXISTS public.prestador_profiles;

-- Create a secure function that returns only safe prestador profile fields
CREATE OR REPLACE FUNCTION public.get_prestador_profiles(_user_ids uuid[])
RETURNS TABLE(user_id uuid, nome text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.user_id, p.nome, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = ANY(_user_ids)
    AND p.user_id IN (SELECT pr.user_id FROM public.prestadores pr);
$$;
