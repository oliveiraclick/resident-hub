CREATE OR REPLACE FUNCTION public.find_similar_emails(_target_email text)
RETURNS TABLE(email text, nome text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT u.email::text, COALESCE(u.raw_user_meta_data->>'nome', '')::text as nome
  FROM auth.users u
  WHERE is_platform_admin(auth.uid())
    AND u.email IS NOT NULL
    AND lower(u.email) != lower(trim(_target_email))
    AND split_part(lower(u.email), '@', 2) = split_part(lower(trim(_target_email)), '@', 2)
    AND (
      split_part(lower(u.email), '@', 1) ILIKE '%' || split_part(lower(trim(_target_email)), '@', 1) || '%'
      OR split_part(lower(trim(_target_email)), '@', 1) ILIKE '%' || split_part(lower(u.email), '@', 1) || '%'
    )
  LIMIT 5;
$$;