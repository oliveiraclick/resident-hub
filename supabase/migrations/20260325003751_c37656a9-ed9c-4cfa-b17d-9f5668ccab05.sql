
CREATE TABLE public.auth_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  user_id uuid,
  nome text,
  evento text NOT NULL DEFAULT 'login_error',
  erro text,
  detalhes text,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;

-- Only platform admins can view logs
CREATE POLICY "Platform admins can view auth_logs"
  ON public.auth_logs FOR SELECT
  TO authenticated
  USING (is_platform_admin(auth.uid()));

-- Anyone can insert logs (needed for failed login attempts where user isn't authenticated)
CREATE POLICY "Anyone can insert auth_logs"
  ON public.auth_logs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Platform admins can delete logs
CREATE POLICY "Platform admins can delete auth_logs"
  ON public.auth_logs FOR DELETE
  TO authenticated
  USING (is_platform_admin(auth.uid()));
