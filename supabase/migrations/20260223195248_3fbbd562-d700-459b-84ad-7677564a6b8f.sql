CREATE POLICY "Platform admins can insert prestadores"
ON public.prestadores
FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()));