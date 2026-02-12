-- Add new optional fields to condominios
ALTER TABLE public.condominios
ADD COLUMN telefone text,
ADD COLUMN responsavel text,
ADD COLUMN logo_url text;

-- Create storage bucket for condominio logos
INSERT INTO storage.buckets (id, name, public) VALUES ('condominio-logos', 'condominio-logos', true);

-- Allow anyone authenticated to upload logos
CREATE POLICY "Admins can upload condominio logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'condominio-logos' AND auth.role() = 'authenticated');

-- Allow public read access to logos
CREATE POLICY "Public can view condominio logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'condominio-logos');

-- Allow admins to update/delete logos
CREATE POLICY "Admins can update condominio logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'condominio-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can delete condominio logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'condominio-logos' AND auth.role() = 'authenticated');