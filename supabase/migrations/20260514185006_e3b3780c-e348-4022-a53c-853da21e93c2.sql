CREATE TABLE IF NOT EXISTS public.categoria_capas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  imagem_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (condominio_id, categoria)
);

ALTER TABLE public.categoria_capas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categoria_capas"
ON public.categoria_capas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins manage their condo categoria_capas"
ON public.categoria_capas FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
      AND ur.condominio_id = categoria_capas.condominio_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
      AND ur.condominio_id = categoria_capas.condominio_id
  )
);

CREATE TRIGGER set_categoria_capas_updated_at
BEFORE UPDATE ON public.categoria_capas
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();