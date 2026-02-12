
DROP POLICY IF EXISTS "Admins can insert condominios" ON public.condominios;

CREATE POLICY "Only platform admins can insert condominios"
ON public.condominios
FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()));
