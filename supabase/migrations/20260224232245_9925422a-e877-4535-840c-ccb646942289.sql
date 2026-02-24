
-- Add imagem_url column to desapegos
ALTER TABLE public.desapegos ADD COLUMN IF NOT EXISTS imagem_url text;

-- Create storage bucket for desapego images
INSERT INTO storage.buckets (id, name, public)
VALUES ('desapegos', 'desapegos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone can view desapego images
CREATE POLICY "Public read desapegos bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'desapegos');

-- RLS: authenticated users can upload to desapegos bucket
CREATE POLICY "Auth users can upload desapego images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'desapegos' AND auth.role() = 'authenticated');

-- RLS: users can update their own desapego images
CREATE POLICY "Users can update own desapego images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'desapegos' AND auth.role() = 'authenticated');

-- RLS: users can delete their own desapego images
CREATE POLICY "Users can delete own desapego images"
ON storage.objects FOR DELETE
USING (bucket_id = 'desapegos' AND auth.role() = 'authenticated');
