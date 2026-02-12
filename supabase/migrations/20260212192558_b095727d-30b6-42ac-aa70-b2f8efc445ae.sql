-- Add aprovado column to user_roles (default false for new registrations)
ALTER TABLE public.user_roles
ADD COLUMN aprovado boolean NOT NULL DEFAULT false;

-- Auto-approve existing users
UPDATE public.user_roles SET aprovado = true;

-- Function to auto-approve morador if their email matches a unit
-- This will be called on registration to check if morador is in the official list
CREATE OR REPLACE FUNCTION public.auto_approve_morador()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the role is morador, check if user is linked to a unidade in that condominio
  IF NEW.role = 'morador' THEN
    IF EXISTS (
      SELECT 1 FROM public.unidades
      WHERE condominio_id = NEW.condominio_id
        AND morador_id = NEW.user_id
    ) THEN
      NEW.aprovado := true;
    END IF;
  END IF;
  
  -- Auto-approve admins and platform_admins
  IF NEW.role IN ('admin', 'platform_admin', 'prestador') THEN
    NEW.aprovado := true;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_approve_morador
BEFORE INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_morador();

-- Helper function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_approved(_user_id uuid, _condominio_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND condominio_id = _condominio_id
      AND aprovado = true
  )
$$;