
-- Activity Logs: ações críticas do sistema
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert activity_logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Platform admins can view activity_logs" ON public.activity_logs FOR SELECT USING (is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins can delete activity_logs" ON public.activity_logs FOR DELETE USING (is_platform_admin(auth.uid()));

CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);

-- Page Views: métricas de uso por módulo
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  page text NOT NULL,
  module text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page_views" ON public.page_views FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Platform admins can view page_views" ON public.page_views FOR SELECT USING (is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins can delete page_views" ON public.page_views FOR DELETE USING (is_platform_admin(auth.uid()));

CREATE INDEX idx_page_views_created ON public.page_views(created_at DESC);
CREATE INDEX idx_page_views_module ON public.page_views(module);

-- Error Logs: erros globais do frontend
CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  message text NOT NULL,
  stack text,
  url text,
  context jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert error_logs" ON public.error_logs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Platform admins can view error_logs" ON public.error_logs FOR SELECT USING (is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins can delete error_logs" ON public.error_logs FOR DELETE USING (is_platform_admin(auth.uid()));

CREATE INDEX idx_error_logs_created ON public.error_logs(created_at DESC);

-- Function Logs: health check de edge functions
CREATE TABLE public.function_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  status text NOT NULL DEFAULT 'success',
  duration_ms integer,
  error text,
  details jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.function_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert function_logs" ON public.function_logs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Platform admins can view function_logs" ON public.function_logs FOR SELECT USING (is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins can delete function_logs" ON public.function_logs FOR DELETE USING (is_platform_admin(auth.uid()));

CREATE INDEX idx_function_logs_created ON public.function_logs(created_at DESC);
CREATE INDEX idx_function_logs_name ON public.function_logs(function_name);
