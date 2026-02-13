
-- Allow condominium admins to update roles within their condominium (for approval)
DROP POLICY "Platform admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'::app_role));
