
-- Eventos (grupo/resenha)
CREATE TABLE public.eventos_amigos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id uuid NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  criador_id uuid NOT NULL,
  titulo text NOT NULL,
  descricao text,
  status text NOT NULL DEFAULT 'ativo',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.eventos_amigos ENABLE ROW LEVEL SECURITY;

-- Participantes
CREATE TABLE public.evento_participantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES public.eventos_amigos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(evento_id, user_id)
);

ALTER TABLE public.evento_participantes ENABLE ROW LEVEL SECURITY;

-- Despesas
CREATE TABLE public.evento_despesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES public.eventos_amigos(id) ON DELETE CASCADE,
  pagador_id uuid NOT NULL,
  valor numeric NOT NULL,
  descricao text,
  recibo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.evento_despesas ENABLE ROW LEVEL SECURITY;

-- Storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('recibos', 'recibos', true);

-- RLS: eventos_amigos
-- Creator and participants can view
CREATE POLICY "Participantes podem ver evento"
  ON public.eventos_amigos FOR SELECT
  USING (
    criador_id = auth.uid()
    OR id IN (SELECT evento_id FROM public.evento_participantes WHERE user_id = auth.uid())
    OR is_platform_admin(auth.uid())
  );

CREATE POLICY "Morador pode criar evento"
  ON public.eventos_amigos FOR INSERT
  WITH CHECK (criador_id = auth.uid() AND belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Criador pode atualizar evento"
  ON public.eventos_amigos FOR UPDATE
  USING (criador_id = auth.uid());

CREATE POLICY "Criador pode deletar evento"
  ON public.eventos_amigos FOR DELETE
  USING (criador_id = auth.uid());

-- RLS: evento_participantes
CREATE POLICY "Participantes podem ver participantes"
  ON public.evento_participantes FOR SELECT
  USING (
    user_id = auth.uid()
    OR evento_id IN (SELECT id FROM public.eventos_amigos WHERE criador_id = auth.uid())
    OR evento_id IN (SELECT evento_id FROM public.evento_participantes ep WHERE ep.user_id = auth.uid())
    OR is_platform_admin(auth.uid())
  );

CREATE POLICY "Criador pode inserir participantes"
  ON public.evento_participantes FOR INSERT
  WITH CHECK (
    evento_id IN (SELECT id FROM public.eventos_amigos WHERE criador_id = auth.uid())
  );

CREATE POLICY "Participante pode atualizar proprio status"
  ON public.evento_participantes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Criador pode deletar participantes"
  ON public.evento_participantes FOR DELETE
  USING (
    evento_id IN (SELECT id FROM public.eventos_amigos WHERE criador_id = auth.uid())
  );

-- RLS: evento_despesas
CREATE POLICY "Participantes podem ver despesas"
  ON public.evento_despesas FOR SELECT
  USING (
    pagador_id = auth.uid()
    OR evento_id IN (SELECT id FROM public.eventos_amigos WHERE criador_id = auth.uid())
    OR evento_id IN (SELECT evento_id FROM public.evento_participantes WHERE user_id = auth.uid())
    OR is_platform_admin(auth.uid())
  );

CREATE POLICY "Participante pode inserir despesa"
  ON public.evento_despesas FOR INSERT
  WITH CHECK (
    pagador_id = auth.uid()
    AND (
      evento_id IN (SELECT id FROM public.eventos_amigos WHERE criador_id = auth.uid())
      OR evento_id IN (SELECT evento_id FROM public.evento_participantes WHERE user_id = auth.uid() AND status = 'aceito')
    )
  );

CREATE POLICY "Pagador pode deletar propria despesa"
  ON public.evento_despesas FOR DELETE
  USING (pagador_id = auth.uid());

CREATE POLICY "Pagador pode atualizar propria despesa"
  ON public.evento_despesas FOR UPDATE
  USING (pagador_id = auth.uid());

-- Storage RLS for recibos
CREATE POLICY "Authenticated can upload recibos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'recibos');

CREATE POLICY "Anyone can view recibos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'recibos');

CREATE POLICY "Owner can delete recibos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'recibos' AND (auth.uid()::text = (storage.foldername(name))[1]));
