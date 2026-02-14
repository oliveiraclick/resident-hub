
-- Add imagem_url column to produtos
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS imagem_url text;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('produtos', 'produtos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public read produtos images" ON storage.objects FOR SELECT USING (bucket_id = 'produtos');

-- Prestadores can upload their own product images
CREATE POLICY "Prestadores can upload produto images" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'produtos' AND auth.role() = 'authenticated');

-- Prestadores can update their own product images
CREATE POLICY "Prestadores can update produto images" ON storage.objects FOR UPDATE
USING (bucket_id = 'produtos' AND auth.role() = 'authenticated');

-- Prestadores can delete their own product images
CREATE POLICY "Prestadores can delete produto images" ON storage.objects FOR DELETE
USING (bucket_id = 'produtos' AND auth.role() = 'authenticated');
