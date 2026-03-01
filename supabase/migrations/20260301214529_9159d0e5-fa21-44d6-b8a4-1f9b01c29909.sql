-- 1. Scope get_prestador_profiles to same condominium
CREATE OR REPLACE FUNCTION public.get_prestador_profiles(_user_ids uuid[])
RETURNS TABLE(user_id uuid, nome text, avatar_url text, telefone text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.user_id, p.nome, p.avatar_url, p.telefone
  FROM public.profiles p
  WHERE p.user_id = ANY(_user_ids)
    AND p.user_id IN (
      SELECT pr.user_id 
      FROM public.prestadores pr
      WHERE pr.condominio_id IN (SELECT get_user_condominio_ids(auth.uid()))
    );
$$;

-- 2. Scope get_desapego_owner_profile to same condominium
CREATE OR REPLACE FUNCTION public.get_desapego_owner_profile(_user_id uuid)
RETURNS TABLE(user_id uuid, nome text, avatar_url text, telefone text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.user_id, p.nome, p.avatar_url, p.telefone
  FROM public.profiles p
  WHERE p.user_id = _user_id
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = _user_id
      AND ur.condominio_id IN (SELECT get_user_condominio_ids(auth.uid()))
    )
  LIMIT 1;
$$;

-- 3. Add SELECT policy for contato_mensagens (platform_admin only)
CREATE POLICY "Platform admins can view contato_mensagens"
ON public.contato_mensagens FOR SELECT
USING (is_platform_admin(auth.uid()));

-- 4. Replace overly permissive INSERT on contato_mensagens
DROP POLICY IF EXISTS "Qualquer pessoa pode enviar mensagem" ON public.contato_mensagens;
CREATE POLICY "Anyone can submit contact form"
ON public.contato_mensagens FOR INSERT
WITH CHECK (
  length(nome) >= 2 AND length(nome) <= 200
  AND length(email) >= 5 AND length(email) <= 255
  AND length(mensagem) >= 5 AND length(mensagem) <= 2000
);

-- 5. Tighten financial records - only admins and own prestadores
DROP POLICY IF EXISTS "Members can view lancamentos" ON public.financeiro_lancamentos;
CREATE POLICY "Admins and own prestador can view lancamentos"
ON public.financeiro_lancamentos FOR SELECT
USING (
  is_platform_admin(auth.uid())
  OR has_role(auth.uid(), condominio_id, 'admin'::app_role)
  OR (prestador_id IS NOT NULL AND prestador_id IN (
    SELECT id FROM public.prestadores WHERE user_id = auth.uid()
  ))
);

-- 6. Tighten pacotes - only morador who owns the unit, or admin
DROP POLICY IF EXISTS "Members can view pacotes" ON public.pacotes;
CREATE POLICY "Admins and unit owners can view pacotes"
ON public.pacotes FOR SELECT
USING (
  is_platform_admin(auth.uid())
  OR has_role(auth.uid(), condominio_id, 'admin'::app_role)
  OR morador_id = auth.uid()
  OR unidade_id IN (
    SELECT id FROM public.unidades WHERE morador_id = auth.uid()
  )
);

-- 7. Make condominio-logos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'condominio-logos';
DROP POLICY IF EXISTS "Public can view condominio logos" ON storage.objects;
CREATE POLICY "Authenticated users can view condominio logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'condominio-logos' AND auth.role() = 'authenticated');