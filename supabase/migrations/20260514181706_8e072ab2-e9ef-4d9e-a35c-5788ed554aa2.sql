-- 1. UTILITY FUNCTIONS
-- Create the standard timestamp update function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. SECURITY FIXES FOR FUNCTIONS
-- Restrict sensitive functions to authenticated users and add caller validation where possible

-- check_email_exists: Ensure caller is authenticated
CREATE OR REPLACE FUNCTION public.check_email_exists(_email text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = lower(trim(_email))
  );
END;
$function$;

-- find_morador_by_phone: Ensure caller is authenticated and belongs to the same condo
CREATE OR REPLACE FUNCTION public.find_morador_by_phone(_telefone text, _condominio_id uuid)
 RETURNS TABLE(user_id uuid, nome text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Security check: caller must be authenticated and belong to the target condominium
  IF auth.uid() IS NULL OR NOT belongs_to_condominio(auth.uid(), _condominio_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.user_id, p.nome
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE ur.role = 'morador'
    AND ur.aprovado = true
    AND ur.condominio_id = _condominio_id
    AND regexp_replace(coalesce(p.telefone,''), '\D', '', 'g')
        = regexp_replace(coalesce(_telefone,''), '\D', '', 'g')
    AND regexp_replace(coalesce(p.telefone,''), '\D', '', 'g') <> ''
  LIMIT 1;
END;
$function$;

-- find_similar_emails: Ensure only platform admins can call
CREATE OR REPLACE FUNCTION public.find_similar_emails(_target_email text)
 RETURNS TABLE(email text, nome text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT is_platform_admin(auth.uid()) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT u.email::text, COALESCE(u.raw_user_meta_data->>'nome', '')::text as nome
  FROM auth.users u
  WHERE u.email IS NOT NULL
    AND lower(u.email) != lower(trim(_target_email))
    AND (
      -- Same domain: local part contains or is contained
      (
        split_part(lower(u.email), '@', 2) = split_part(lower(trim(_target_email)), '@', 2)
        AND (
          split_part(lower(u.email), '@', 1) ILIKE '%' || split_part(lower(trim(_target_email)), '@', 1) || '%'
          OR split_part(lower(trim(_target_email)), '@', 1) ILIKE '%' || split_part(lower(u.email), '@', 1) || '%'
        )
      )
      OR
      -- Different but similar domain (typos)
      (
        split_part(lower(u.email), '@', 2) != split_part(lower(trim(_target_email)), '@', 2)
        AND extensions.levenshtein(split_part(lower(u.email), '@', 2), split_part(lower(trim(_target_email)), '@', 2)) <= 2
        AND (
          split_part(lower(u.email), '@', 1) = split_part(lower(trim(_target_email)), '@', 1)
          OR split_part(lower(u.email), '@', 1) ILIKE '%' || split_part(lower(trim(_target_email)), '@', 1) || '%'
          OR split_part(lower(trim(_target_email)), '@', 1) ILIKE '%' || split_part(lower(u.email), '@', 1) || '%'
        )
      )
    )
  LIMIT 5;
END;
$function$;

-- 3. RLS POLICY HARDENING
-- Restrict log insertion to authenticated users only to prevent anonymous spam

DROP POLICY IF EXISTS "Anyone can insert auth_logs" ON public.auth_logs;
CREATE POLICY "Authenticated users can insert auth_logs" 
ON public.auth_logs FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can insert error_logs" ON public.error_logs;
CREATE POLICY "Authenticated users can insert error_logs" 
ON public.error_logs FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Hardening products visibility: Only active products are public for SELECT
DROP POLICY IF EXISTS "Public can view active produtos" ON public.produtos;
CREATE POLICY "Public can view active produtos" 
ON public.produtos FOR SELECT 
USING (status = 'ativo');

-- 4. DATABASE OPTIMIZATIONS (INDEXES & CONSTRAINTS)

-- Positive values constraints
ALTER TABLE public.produtos ADD CONSTRAINT products_price_positive CHECK (preco >= 0);
ALTER TABLE public.desapegos ADD CONSTRAINT desapegos_price_positive CHECK (preco >= 0);
ALTER TABLE public.financeiro_lancamentos ADD CONSTRAINT financial_amount_positive CHECK (valor >= 0);

-- Performance Indexes for common filters
CREATE INDEX IF NOT EXISTS idx_user_roles_user_condo ON public.user_roles (user_id, condominio_id, role) WHERE aprovado = true;
CREATE INDEX IF NOT EXISTS idx_pacotes_morador_status ON public.pacotes (morador_id, status);
CREATE INDEX IF NOT EXISTS idx_reservas_condo_data ON public.reservas (condominio_id, data);
CREATE INDEX IF NOT EXISTS idx_produtos_condo_status ON public.produtos (condominio_id, status);
CREATE INDEX IF NOT EXISTS idx_desapegos_condo_status ON public.desapegos (condominio_id, status);
CREATE INDEX IF NOT EXISTS idx_assinaturas_prestador_status ON public.assinaturas_prestador (prestador_id, status);

-- Ensure updated_at triggers exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
            CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles 
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
        END IF;
    END IF;
END $$;
