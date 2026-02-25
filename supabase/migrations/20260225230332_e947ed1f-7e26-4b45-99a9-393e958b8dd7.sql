
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  _role text;
  _condominio_id uuid;
  _especialidade text;
  _descricao text;
  _telefone text;
  _codigo_indicacao text;
BEGIN
  _role := NEW.raw_user_meta_data->>'role';
  _condominio_id := (NEW.raw_user_meta_data->>'condominio_id')::uuid;
  _telefone := NEW.raw_user_meta_data->>'telefone';
  _especialidade := NEW.raw_user_meta_data->>'especialidade';
  _descricao := NEW.raw_user_meta_data->>'descricao';
  _codigo_indicacao := NEW.raw_user_meta_data->>'codigo_indicacao';

  -- Create profile with terms accepted
  INSERT INTO public.profiles (user_id, nome, telefone, termos_aceitos_em, condicoes_aceitas_em)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    _telefone,
    now(),
    now()
  );

  -- Create user_role if role and condominio provided
  IF _role IS NOT NULL AND _condominio_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, condominio_id)
    VALUES (NEW.id, _role::app_role, _condominio_id);
  END IF;

  -- Create prestador record if role is prestador
  IF _role = 'prestador' AND _condominio_id IS NOT NULL AND _especialidade IS NOT NULL THEN
    INSERT INTO public.prestadores (user_id, condominio_id, especialidade, descricao)
    VALUES (NEW.id, _condominio_id, _especialidade, _descricao);
  END IF;

  -- Create indicacao if codigo provided (codigo = user_id of the referrer)
  IF _codigo_indicacao IS NOT NULL AND _codigo_indicacao != '' THEN
    BEGIN
      INSERT INTO public.indicacoes (indicador_id, indicado_id, status)
      VALUES (_codigo_indicacao::uuid, NEW.id, 'confirmada');
    EXCEPTION WHEN OTHERS THEN
      -- Ignore invalid codes silently
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$function$;
