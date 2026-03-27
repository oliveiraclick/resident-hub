
-- Function to get phone numbers by emails (for admin logs page)
CREATE OR REPLACE FUNCTION public.get_phones_by_emails(_emails text[])
RETURNS TABLE(email text, telefone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT u.email::text, p.telefone
  FROM auth.users u
  INNER JOIN public.profiles p ON p.user_id = u.id
  WHERE is_platform_admin(auth.uid())
    AND u.email = ANY(_emails)
    AND p.telefone IS NOT NULL
    AND p.telefone != '';
$$;

-- Function to check if an email exists in auth.users (for login error distinction)
CREATE OR REPLACE FUNCTION public.check_email_exists(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = lower(trim(_email))
  );
$$;
