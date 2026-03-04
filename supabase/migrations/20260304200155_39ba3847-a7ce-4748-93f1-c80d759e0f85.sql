
-- Table for planned event items (sound, band, tent, etc.)
CREATE TABLE public.evento_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES public.eventos_amigos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  valor_estimado numeric NOT NULL DEFAULT 0,
  responsavel_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.evento_itens ENABLE ROW LEVEL SECURITY;

-- Only event members can view items
CREATE POLICY "Membros podem ver itens"
  ON public.evento_itens FOR SELECT
  USING (is_evento_member(auth.uid(), evento_id) OR is_platform_admin(auth.uid()));

-- Participants can insert items
CREATE POLICY "Participante pode inserir item"
  ON public.evento_itens FOR INSERT
  WITH CHECK (is_evento_member(auth.uid(), evento_id));

-- Creator or item creator can update
CREATE POLICY "Membro pode atualizar item"
  ON public.evento_itens FOR UPDATE
  USING (is_evento_member(auth.uid(), evento_id));

-- Creator or item creator can delete
CREATE POLICY "Membro pode deletar item"
  ON public.evento_itens FOR DELETE
  USING (is_evento_member(auth.uid(), evento_id));
