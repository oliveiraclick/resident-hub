
CREATE TABLE public.cupons_prestador (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  codigo text NOT NULL,
  desconto_percent integer NOT NULL DEFAULT 10,
  ativo boolean NOT NULL DEFAULT true,
  validade date,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cupons_prestador ENABLE ROW LEVEL SECURITY;

-- Prestador can manage own cupons
CREATE POLICY "Prestador can manage own cupons"
ON public.cupons_prestador
FOR ALL
TO authenticated
USING (prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid()))
WITH CHECK (prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid()));

-- Members of same condominio can view active cupons
CREATE POLICY "Members can view active cupons"
ON public.cupons_prestador
FOR SELECT
TO authenticated
USING (
  ativo = true 
  AND (validade IS NULL OR validade >= CURRENT_DATE)
  AND prestador_id IN (
    SELECT id FROM public.prestadores 
    WHERE condominio_id IN (SELECT get_user_condominio_ids(auth.uid()))
  )
);

-- Platform admins full access
CREATE POLICY "Platform admins full cupons"
ON public.cupons_prestador
FOR ALL
TO authenticated
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));
