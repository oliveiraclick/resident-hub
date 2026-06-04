CREATE TABLE IF NOT EXISTS public.copa_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  status TEXT NOT NULL,
  payload JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT ON public.copa_api_logs TO authenticated;
GRANT ALL ON public.copa_api_logs TO service_role;
ALTER TABLE public.copa_api_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages logs" ON public.copa_api_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

INSERT INTO public.copa_config (key, value) 
VALUES ('api_sync_enabled', '"true"'), ('last_api_sync', '""')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;