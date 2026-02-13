
-- Update handle_new_user to also create user_roles and prestadores based on signup metadata
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
BEGIN
  _role := NEW.raw_user_meta_data->>'role';
  _condominio_id := (NEW.raw_user_meta_data->>'condominio_id')::uuid;
  _telefone := NEW.raw_user_meta_data->>'telefone';
  _especialidade := NEW.raw_user_meta_data->>'especialidade';
  _descricao := NEW.raw_user_meta_data->>'descricao';

  -- Create profile
  INSERT INTO public.profiles (user_id, nome, telefone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    _telefone
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

  RETURN NEW;
END;
$$;
