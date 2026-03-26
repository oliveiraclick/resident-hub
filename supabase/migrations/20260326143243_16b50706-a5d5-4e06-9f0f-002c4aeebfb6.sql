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
    AND (
      -- Same domain: local part contains or is contained
      (
        split_part(lower(u.email), '@', 2) = split_part(lower(trim(_target_email)), '@', 2)
        AND (
          split_part(lower(u.email), '@', 1) ILIKE '%' || split_part(lower(trim(_target_email)), '@', 1) || '%'
          OR split_part(lower(trim(_target_email)), '@', 1) ILIKE '%' || split_part(lower(u.email), '@', 1) || '%'
        )
      )
      OR
      -- Different but similar domain (typos like hormail/hotmail)
      (
        split_part(lower(u.email), '@', 2) != split_part(lower(trim(_target_email)), '@', 2)
        AND extensions.levenshtein(split_part(lower(u.email), '@', 2), split_part(lower(trim(_target_email)), '@', 2)) <= 2
        AND (
          split_part(lower(u.email), '@', 1) = split_part(lower(trim(_target_email)), '@', 1)
          OR split_part(lower(u.email), '@', 1) ILIKE '%' || split_part(lower(trim(_target_email)), '@', 1) || '%'
          OR split_part(lower(trim(_target_email)), '@', 1) ILIKE '%' || split_part(lower(u.email), '@', 1) || '%'
        )
      )
      OR
      -- Same domain, levenshtein on local part (catches araujo8 vs araujo18)
      (
        split_part(lower(u.email), '@', 2) = split_part(lower(trim(_target_email)), '@', 2)
        AND extensions.levenshtein(split_part(lower(u.email), '@', 1), split_part(lower(trim(_target_email)), '@', 1)) <= 3
      )
    )
  LIMIT 5;
$$;