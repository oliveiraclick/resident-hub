
-- 1. Add short referral code column to prestadores
ALTER TABLE public.prestadores
ADD COLUMN codigo_indicacao text UNIQUE;

-- 2. Function to generate a random short code
CREATE OR REPLACE FUNCTION public.generate_codigo_indicacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _code text;
  _exists boolean;
BEGIN
  LOOP
    _code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM public.prestadores WHERE codigo_indicacao = _code) INTO _exists;
    EXIT WHEN NOT _exists;
  END LOOP;
  NEW.codigo_indicacao := _code;
  RETURN NEW;
END;
$$;

-- 3. Trigger to auto-generate code on insert
CREATE TRIGGER trg_generate_codigo_indicacao
BEFORE INSERT ON public.prestadores
FOR EACH ROW
WHEN (NEW.codigo_indicacao IS NULL)
EXECUTE FUNCTION public.generate_codigo_indicacao();

-- 4. Backfill existing prestadores with codes
DO $$
DECLARE
  r RECORD;
  _code text;
  _exists boolean;
BEGIN
  FOR r IN SELECT id FROM public.prestadores WHERE codigo_indicacao IS NULL LOOP
    LOOP
      _code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
      SELECT EXISTS(SELECT 1 FROM public.prestadores WHERE codigo_indicacao = _code) INTO _exists;
      EXIT WHEN NOT _exists;
    END LOOP;
    UPDATE public.prestadores SET codigo_indicacao = _code WHERE id = r.id;
  END LOOP;
END;
$$;

-- 5. Update handle_new_user to resolve short code to user_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role text;
  _condominio_id uuid;
  _especialidade text;
  _descricao text;
  _telefone text;
  _codigo_indicacao text;
  _indicador_user_id uuid;
BEGIN
  _role := NEW.raw_user_meta_data->>'role';
  _condominio_id := (NEW.raw_user_meta_data->>'condominio_id')::uuid;
  _telefone := NEW.raw_user_meta_data->>'telefone';
  _especialidade := NEW.raw_user_meta_data->>'especialidade';
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
    INSERT INTO public.prestadores (user_id, condominio_id, especialidade, descricao)
    VALUES (NEW.id, _condominio_id, _especialidade, _descricao);
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
$$;

-- 6. Create RPC to get prestador code by user_id (for sharing)
CREATE OR REPLACE FUNCTION public.get_prestador_codigo(p_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT codigo_indicacao FROM public.prestadores WHERE user_id = p_user_id LIMIT 1;
$$;
