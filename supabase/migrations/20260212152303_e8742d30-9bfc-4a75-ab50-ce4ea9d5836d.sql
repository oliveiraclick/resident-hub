
-- Create is_platform_admin function
CREATE OR REPLACE FUNCTION public.is_platform_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id
      AND role = 'platform_admin'
  );
$$;

-- SELECT policies adjustments

DROP POLICY IF EXISTS "Users can view their condominios" ON public.condominios;
CREATE POLICY "Users can view their condominios"
ON public.condominios FOR SELECT
USING (is_platform_admin(auth.uid()) OR id IN (SELECT get_user_condominio_ids(auth.uid())));

DROP POLICY IF EXISTS "Members can view avaliacoes" ON public.avaliacoes;
CREATE POLICY "Members can view avaliacoes"
ON public.avaliacoes FOR SELECT
USING (is_platform_admin(auth.uid()) OR belongs_to_condominio(auth.uid(), condominio_id));

DROP POLICY IF EXISTS "Members can view desapegos" ON public.desapegos;
CREATE POLICY "Members can view desapegos"
ON public.desapegos FOR SELECT
USING (is_platform_admin(auth.uid()) OR belongs_to_condominio(auth.uid(), condominio_id));

DROP POLICY IF EXISTS "Members can view lancamentos" ON public.financeiro_lancamentos;
CREATE POLICY "Members can view lancamentos"
ON public.financeiro_lancamentos FOR SELECT
USING (is_platform_admin(auth.uid()) OR belongs_to_condominio(auth.uid(), condominio_id));

DROP POLICY IF EXISTS "Members can view lotes" ON public.lotes;
CREATE POLICY "Members can view lotes"
ON public.lotes FOR SELECT
USING (is_platform_admin(auth.uid()) OR belongs_to_condominio(auth.uid(), condominio_id));

DROP POLICY IF EXISTS "Members can view pacotes" ON public.pacotes;
CREATE POLICY "Members can view pacotes"
ON public.pacotes FOR SELECT
USING (is_platform_admin(auth.uid()) OR belongs_to_condominio(auth.uid(), condominio_id));

DROP POLICY IF EXISTS "Members can view prestadores" ON public.prestadores;
CREATE POLICY "Members can view prestadores"
ON public.prestadores FOR SELECT
USING (is_platform_admin(auth.uid()) OR belongs_to_condominio(auth.uid(), condominio_id));

DROP POLICY IF EXISTS "Members can view produtos" ON public.produtos;
CREATE POLICY "Members can view produtos"
ON public.produtos FOR SELECT
USING (is_platform_admin(auth.uid()) OR belongs_to_condominio(auth.uid(), condominio_id));

DROP POLICY IF EXISTS "Members can view servicos" ON public.servicos;
CREATE POLICY "Members can view servicos"
ON public.servicos FOR SELECT
USING (is_platform_admin(auth.uid()) OR belongs_to_condominio(auth.uid(), condominio_id));

DROP POLICY IF EXISTS "Members can view unidades" ON public.unidades;
CREATE POLICY "Members can view unidades"
ON public.unidades FOR SELECT
USING (is_platform_admin(auth.uid()) OR belongs_to_condominio(auth.uid(), condominio_id));

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (is_platform_admin(auth.uid()) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (is_platform_admin(auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view roles in their condominio" ON public.user_roles;
CREATE POLICY "Admins can view roles in their condominio"
ON public.user_roles FOR SELECT
USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'));

-- INSERT/UPDATE/DELETE policies adjustments

DROP POLICY IF EXISTS "Admins can insert condominios" ON public.condominios;
CREATE POLICY "Admins can insert condominios"
ON public.condominios FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR true);

DROP POLICY IF EXISTS "Admins can update their condominios" ON public.condominios;
CREATE POLICY "Admins can update their condominios"
ON public.condominios FOR UPDATE
USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), id, 'admin'));

DROP POLICY IF EXISTS "Admins can insert lancamentos" ON public.financeiro_lancamentos;
CREATE POLICY "Admins can insert lancamentos"
ON public.financeiro_lancamentos FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'));

DROP POLICY IF EXISTS "Admins can update lancamentos" ON public.financeiro_lancamentos;
CREATE POLICY "Admins can update lancamentos"
ON public.financeiro_lancamentos FOR UPDATE
USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'));

DROP POLICY IF EXISTS "Admins can delete lancamentos" ON public.financeiro_lancamentos;
CREATE POLICY "Admins can delete lancamentos"
ON public.financeiro_lancamentos FOR DELETE
USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'));

DROP POLICY IF EXISTS "Admins can manage lotes" ON public.lotes;
CREATE POLICY "Admins can manage lotes"
ON public.lotes FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'));

DROP POLICY IF EXISTS "Admins can update lotes" ON public.lotes;
CREATE POLICY "Admins can update lotes"
ON public.lotes FOR UPDATE
USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'));

DROP POLICY IF EXISTS "Admins can delete lotes" ON public.lotes;
CREATE POLICY "Admins can delete lotes"
ON public.lotes FOR DELETE
USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'));

DROP POLICY IF EXISTS "Admins can insert pacotes" ON public.pacotes;
CREATE POLICY "Admins can insert pacotes"
ON public.pacotes FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'));

DROP POLICY IF EXISTS "Admins can update pacotes" ON public.pacotes;
CREATE POLICY "Admins can update pacotes"
ON public.pacotes FOR UPDATE
USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'));

DROP POLICY IF EXISTS "Admins can delete pacotes" ON public.pacotes;
CREATE POLICY "Admins can delete pacotes"
ON public.pacotes FOR DELETE
USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'));

DROP POLICY IF EXISTS "Admins can manage unidades" ON public.unidades;
CREATE POLICY "Admins can manage unidades"
ON public.unidades FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'));

DROP POLICY IF EXISTS "Admins can update unidades" ON public.unidades;
CREATE POLICY "Admins can update unidades"
ON public.unidades FOR UPDATE
USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'));

DROP POLICY IF EXISTS "Admins can delete unidades" ON public.unidades;
CREATE POLICY "Admins can delete unidades"
ON public.unidades FOR DELETE
USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'));

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'));
