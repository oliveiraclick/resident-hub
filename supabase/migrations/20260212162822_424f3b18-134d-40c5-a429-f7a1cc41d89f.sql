
-- Allow members of the same condominio to view profiles of prestadores
CREATE POLICY "Members can view prestador profiles"
ON public.profiles
FOR SELECT
USING (
  is_platform_admin(auth.uid())
  OR auth.uid() = user_id
  OR user_id IN (
    SELECT p.user_id FROM public.prestadores p
    WHERE p.condominio_id IN (
      SELECT get_user_condominio_ids(auth.uid())
    )
  )
);
