
CREATE TABLE public.avisos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condominio_id uuid NOT NULL REFERENCES public.condominios(id),
  texto text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view active avisos"
ON public.avisos FOR SELECT
USING (is_platform_admin(auth.uid()) OR belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Admins can insert avisos"
ON public.avisos FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'::app_role));

CREATE POLICY "Admins can update avisos"
ON public.avisos FOR UPDATE
USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'::app_role));

CREATE POLICY "Admins can delete avisos"
ON public.avisos FOR DELETE
USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'::app_role));
