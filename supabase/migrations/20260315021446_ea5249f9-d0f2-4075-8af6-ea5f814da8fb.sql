
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role text;
  _condominio_id uuid;
  _especialidade text;
  _sub_especialidade text;
  _descricao text;
  _telefone text;
  _codigo_indicacao text;
  _indicador_user_id uuid;
BEGIN
  _role := NEW.raw_user_meta_data->>'role';
  _condominio_id := (NEW.raw_user_meta_data->>'condominio_id')::uuid;
  _telefone := NEW.raw_user_meta_data->>'telefone';
  _especialidade := NEW.raw_user_meta_data->>'especialidade';
  _sub_especialidade := NEW.raw_user_meta_data->>'sub_especialidade';
  _descricao := NEW.raw_user_meta_data->>'descricao';
  _codigo_indicacao := NEW.raw_user_meta_data->>'codigo_indicacao';

  -- Create profile
  INSERT INTO public.profiles (user_id, nome, telefone, termos_aceitos_em, condicoes_aceitas_em)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    _telefone,
    now(),
    now()
  );

  -- Create user_role
  IF _role IS NOT NULL AND _condominio_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, condominio_id)
    VALUES (NEW.id, _role::app_role, _condominio_id);
  END IF;

  -- Create prestador record
  IF _role = 'prestador' AND _condominio_id IS NOT NULL AND _especialidade IS NOT NULL THEN
    INSERT INTO public.prestadores (user_id, condominio_id, especialidade, sub_especialidade, descricao)
    VALUES (NEW.id, _condominio_id, _especialidade, _sub_especialidade, _descricao);
  END IF;

  -- Auto-save sub_especialidade for future users
  IF _especialidade IS NOT NULL AND _sub_especialidade IS NOT NULL AND _sub_especialidade != '' THEN
    INSERT INTO public.sub_especialidades (categoria_nome, nome)
    VALUES (_especialidade, _sub_especialidade)
    ON CONFLICT (categoria_nome, nome) DO NOTHING;
  END IF;

  -- Create indicacao using short code lookup
  IF _codigo_indicacao IS NOT NULL AND _codigo_indicacao != '' THEN
    BEGIN
      SELECT p.user_id INTO _indicador_user_id
      FROM public.prestadores p
      WHERE p.codigo_indicacao = upper(trim(_codigo_indicacao))
      LIMIT 1;

      IF _indicador_user_id IS NOT NULL THEN
        INSERT INTO public.indicacoes (indicador_id, indicado_id, status)
        VALUES (_indicador_user_id, NEW.id, 'confirmada');
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$function$;
