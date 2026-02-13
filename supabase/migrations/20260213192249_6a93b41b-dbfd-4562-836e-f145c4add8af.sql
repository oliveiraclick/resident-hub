-- Allow unauthenticated users to view condominios (needed for registration)
CREATE POLICY "Anyone can view condominios for registration"
ON public.condominios
FOR SELECT
USING (true);