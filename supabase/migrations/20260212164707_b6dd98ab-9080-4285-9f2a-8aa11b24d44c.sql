
-- Fix: Change view to SECURITY INVOKER (safe - uses calling user's permissions)
DROP VIEW IF EXISTS public.prestador_profiles;

CREATE VIEW public.prestador_profiles WITH (security_invoker = true) AS
SELECT 
  p.user_id,
  p.nome,
  p.avatar_url
FROM public.profiles p
WHERE p.user_id IN (
  SELECT pr.user_id FROM public.prestadores pr
);

GRANT SELECT ON public.prestador_profiles TO authenticated;
