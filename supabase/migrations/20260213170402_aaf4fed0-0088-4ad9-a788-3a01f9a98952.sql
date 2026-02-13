
CREATE TABLE public.banners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condominio_id uuid NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  subtitulo text,
  imagem_url text,
  link text,
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view active banners"
ON public.banners FOR SELECT
USING (is_platform_admin(auth.uid()) OR belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Admins can insert banners"
ON public.banners FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'::app_role));

CREATE POLICY "Admins can update banners"
ON public.banners FOR UPDATE
USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'::app_role));

CREATE POLICY "Admins can delete banners"
ON public.banners FOR DELETE
USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'::app_role));

-- Storage bucket for banner images
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);

CREATE POLICY "Anyone can view banner images"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Admins can upload banner images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'banners');

CREATE POLICY "Admins can update banner images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'banners');

CREATE POLICY "Admins can delete banner images"
ON storage.objects FOR DELETE
USING (bucket_id = 'banners');
