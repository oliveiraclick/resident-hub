
-- Create security definer function to check event membership
CREATE OR REPLACE FUNCTION public.is_evento_member(_user_id uuid, _evento_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.eventos_amigos WHERE id = _evento_id AND criador_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.evento_participantes WHERE evento_id = _evento_id AND user_id = _user_id
  );
$$;

-- Fix evento_participantes SELECT policy to avoid self-reference
DROP POLICY "Participantes podem ver participantes" ON public.evento_participantes;

CREATE POLICY "Participantes podem ver participantes"
  ON public.evento_participantes FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_evento_member(auth.uid(), evento_id)
    OR is_platform_admin(auth.uid())
  );
