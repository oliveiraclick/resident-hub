
-- Create storage bucket for visitor photos
INSERT INTO storage.buckets (id, name, public) VALUES ('visitantes', 'visitantes', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Visitor photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'visitantes');

-- Service role handles uploads (via edge function), no user policy needed
