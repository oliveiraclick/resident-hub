DROP FUNCTION IF EXISTS public.find_morador_by_phone(text, uuid);

CREATE OR REPLACE FUNCTION public.find_morador_by_phone(_telefone text, _condominio_id uuid)
 RETURNS TABLE(user_id uuid, nome text, unidade_numero text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT belongs_to_condominio(auth.uid(), _condominio_id) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.user_id, p.nome, ''::text AS unidade_numero
  FROM public.profiles p
  JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE ur.role = 'morador'
    AND ur.aprovado = true
    AND ur.condominio_id = _condominio_id
    AND regexp_replace(coalesce(p.telefone,''), '\D', '', 'g')
        = regexp_replace(coalesce(_telefone,''), '\D', '', 'g')
    AND regexp_replace(coalesce(p.telefone,''), '\D', '', 'g') <> ''
  LIMIT 1;
END;
$function$;