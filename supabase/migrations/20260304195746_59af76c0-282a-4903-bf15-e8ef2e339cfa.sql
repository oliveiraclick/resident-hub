
-- Add PIX info to event creator
ALTER TABLE public.eventos_amigos
  ADD COLUMN pix_chave text,
  ADD COLUMN pix_tipo text DEFAULT 'cpf';

-- Payments table: tracks who paid whom with proof
CREATE TABLE public.evento_pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES public.eventos_amigos(id) ON DELETE CASCADE,
  pagador_id uuid NOT NULL,
  recebedor_id uuid NOT NULL,
  valor numeric NOT NULL,
  comprovante_url text,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.evento_pagamentos ENABLE ROW LEVEL SECURITY;

-- RLS: only event members can see/manage payments
CREATE POLICY "Membros podem ver pagamentos"
  ON public.evento_pagamentos FOR SELECT
  USING (
    pagador_id = auth.uid()
    OR recebedor_id = auth.uid()
    OR is_evento_member(auth.uid(), evento_id)
    OR is_platform_admin(auth.uid())
  );

CREATE POLICY "Pagador pode inserir pagamento"
  ON public.evento_pagamentos FOR INSERT
  WITH CHECK (
    pagador_id = auth.uid()
    AND is_evento_member(auth.uid(), evento_id)
  );

CREATE POLICY "Recebedor pode confirmar pagamento"
  ON public.evento_pagamentos FOR UPDATE
  USING (recebedor_id = auth.uid());

CREATE POLICY "Pagador pode deletar pagamento pendente"
  ON public.evento_pagamentos FOR DELETE
  USING (pagador_id = auth.uid() AND status = 'pendente');

-- Storage for payment proofs
CREATE POLICY "Authenticated can upload comprovantes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'recibos');
