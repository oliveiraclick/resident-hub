
-- 1. Fix role functions to require aprovado=true
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _condominio_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND condominio_id = _condominio_id
      AND role = _role
      AND aprovado = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id
      AND role = 'platform_admin'
      AND aprovado = true
  );
$$;

CREATE OR REPLACE FUNCTION public.belongs_to_condominio(_user_id uuid, _condominio_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND condominio_id = _condominio_id
      AND aprovado = true
  )
$$;

-- 2. Replace permissive self-insert policy on user_roles with safe variant
DROP POLICY IF EXISTS "allow_self_insert_user_roles" ON public.user_roles;

CREATE POLICY "users_can_self_insert_safe_roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role IN ('morador'::app_role, 'prestador'::app_role)
  AND aprovado = false
);

-- 3. Restrict condominios SELECT - hide contact info from anon users
DROP POLICY IF EXISTS "Anyone can view condominios for registration" ON public.condominios;

-- Public registration view: only id+nome via a security definer function
CREATE OR REPLACE FUNCTION public.get_condominios_for_registration()
RETURNS TABLE(id uuid, nome text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, nome FROM public.condominios ORDER BY nome;
$$;

GRANT EXECUTE ON FUNCTION public.get_condominios_for_registration() TO anon, authenticated;

-- Authenticated users can still see basic info (full row) only for their condominios via existing "Users can view their condominios" policy.
-- Add a minimal policy so anon clients can no longer read contact details.
-- (Existing "Users can view their condominios" policy already allows authenticated members.)

-- 4. Scope SECURITY DEFINER profile functions properly (already mostly scoped, but reinforce)
CREATE OR REPLACE FUNCTION public.get_prestador_profiles(_user_ids uuid[])
RETURNS TABLE(user_id uuid, nome text, avatar_url text, telefone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.user_id, p.nome, p.avatar_url, p.telefone
  FROM public.profiles p
  WHERE p.user_id = ANY(_user_ids)
    AND auth.uid() IS NOT NULL
    AND p.user_id IN (
      SELECT pr.user_id
      FROM public.prestadores pr
      WHERE pr.condominio_id IN (SELECT public.get_user_condominio_ids(auth.uid()))
    );
$$;

CREATE OR REPLACE FUNCTION public.get_desapego_owner_profile(_user_id uuid)
RETURNS TABLE(user_id uuid, nome text, avatar_url text, telefone text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.user_id, p.nome, p.avatar_url, p.telefone
  FROM public.profiles p
  WHERE p.user_id = _user_id
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = _user_id
        AND ur.condominio_id IN (SELECT public.get_user_condominio_ids(auth.uid()))
    )
  LIMIT 1;
$$;

-- 5. Restrict Realtime broadcast on banner_solicitacoes by removing it from publication
-- (Tighten data leak: prestadores see only their own rows, admins see all - via RLS the table is fine,
-- but Realtime broadcasts ignore RLS unless filter set. Safest: remove from realtime publication.)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'banner_solicitacoes'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.banner_solicitacoes';
  END IF;
END $$;
