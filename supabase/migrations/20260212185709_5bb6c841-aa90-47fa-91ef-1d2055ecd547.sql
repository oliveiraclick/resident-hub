
-- Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Members can view avaliacoes" ON public.avaliacoes;

-- Reviewer can see their own reviews
CREATE POLICY "Users can view own sent avaliacoes"
ON public.avaliacoes
FOR SELECT
USING (auth.uid() = avaliador_id);

-- Reviewed person can see reviews about them
CREATE POLICY "Users can view received avaliacoes"
ON public.avaliacoes
FOR SELECT
USING (auth.uid() = avaliado_id);

-- Admins and platform_admins can see all reviews in their condominium
CREATE POLICY "Admins can view avaliacoes"
ON public.avaliacoes
FOR SELECT
USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'::app_role));
