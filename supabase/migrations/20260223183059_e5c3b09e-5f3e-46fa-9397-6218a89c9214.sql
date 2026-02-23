CREATE POLICY "Platform admins can update prestadores"
ON public.prestadores
FOR UPDATE
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));