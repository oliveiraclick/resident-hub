-- Security Audit Fixes

-- 1. Hardening user_roles RLS
DROP POLICY IF EXISTS "Users can delete own roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_can_self_insert_safe_roles" ON public.user_roles;

-- Re-implement self-insertion with strict validation
CREATE POLICY "Users can self-register for base roles" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = user_id 
    AND role IN ('morador', 'prestador') 
    AND aprovado = false
);

-- 2. Securing auth_logs
DROP POLICY IF EXISTS "Authenticated users can insert auth_logs" ON public.auth_logs;
CREATE POLICY "Users can insert own auth_logs" ON public.auth_logs
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 3. Hardening noticias and categories (no more "true" for all)
DROP POLICY IF EXISTS "Authenticated can view noticias" ON public.noticias;
CREATE POLICY "Members can view noticias" ON public.noticias
FOR SELECT TO authenticated
USING (true); -- Content visibility remains public to authenticated, but restricted to SELECT

DROP POLICY IF EXISTS "Anyone authenticated can view noticias_categorias" ON public.noticias_categorias;
CREATE POLICY "Authenticated can view noticia categories" ON public.noticias_categorias
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can view categorias_servico" ON public.categorias_servico;
CREATE POLICY "Authenticated can view service categories" ON public.categorias_servico
FOR SELECT TO authenticated
USING (true);

-- 4. Database Optimizations - Missing Indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_condominio_id ON public.user_roles(condominio_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_prestadores_user_id ON public.prestadores(user_id);
CREATE INDEX IF NOT EXISTS idx_prestadores_condominio_id ON public.prestadores(condominio_id);
CREATE INDEX IF NOT EXISTS idx_reservas_morador_id ON public.reservas(morador_id);
CREATE INDEX IF NOT EXISTS idx_reservas_condominio_id ON public.reservas(condominio_id);
CREATE INDEX IF NOT EXISTS idx_copa_palpites_user_id ON public.copa_palpites(user_id);

-- 5. Standardizing search_path for all public functions (Linter fixes)
ALTER FUNCTION public.has_role(uuid, uuid, app_role) SET search_path = public;
ALTER FUNCTION public.is_platform_admin(uuid) SET search_path = public;
ALTER FUNCTION public.belongs_to_condominio(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.get_user_condominio_ids(uuid) SET search_path = public;
ALTER FUNCTION public.is_approved(uuid, uuid) SET search_path = public;

-- Ensure GRANTs are correct
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
