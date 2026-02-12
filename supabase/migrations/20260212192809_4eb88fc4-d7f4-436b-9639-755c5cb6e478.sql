-- Allow platform admins to delete condominios
CREATE POLICY "Platform admins can delete condominios"
ON public.condominios FOR DELETE
USING (is_platform_admin(auth.uid()));

-- Allow platform admins to update user_roles
CREATE POLICY "Platform admins can update roles"
ON public.user_roles FOR UPDATE
USING (is_platform_admin(auth.uid()));