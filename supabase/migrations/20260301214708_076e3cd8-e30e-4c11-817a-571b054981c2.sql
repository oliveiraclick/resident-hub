-- Revert condominio-logos to public (logos are public branding, acceptable risk)
UPDATE storage.buckets SET public = true WHERE id = 'condominio-logos';
DROP POLICY IF EXISTS "Authenticated users can view condominio logos" ON storage.objects;
CREATE POLICY "Public can view condominio logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'condominio-logos');