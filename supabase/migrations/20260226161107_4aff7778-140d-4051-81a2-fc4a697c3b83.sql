
-- Allow users to delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to delete their own roles (for account deletion)
CREATE POLICY "Users can delete own roles"
ON public.user_roles
FOR DELETE
USING (user_id = auth.uid());
