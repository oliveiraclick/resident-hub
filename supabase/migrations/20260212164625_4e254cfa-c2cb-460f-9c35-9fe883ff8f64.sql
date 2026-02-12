
-- Drop the overly permissive policy that exposes full profile rows (including telefone)
DROP POLICY IF EXISTS "Members can view prestador profiles" ON public.profiles;

-- Recreate with tighter scope: members can only see prestador profiles' nome (not telefone)
-- Since RLS is row-level, we'll use a secure view instead

-- Create a secure view that only exposes safe fields
CREATE OR REPLACE VIEW public.prestador_profiles WITH (security_invoker = false) AS
SELECT 
  p.user_id,
  p.nome,
  p.avatar_url
FROM public.profiles p
WHERE p.user_id IN (
  SELECT pr.user_id FROM public.prestadores pr
);

-- Grant access to the view
GRANT SELECT ON public.prestador_profiles TO authenticated;
GRANT SELECT ON public.prestador_profiles TO anon;
