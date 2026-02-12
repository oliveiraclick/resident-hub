
-- Tabela de espaços/áreas comuns do condomínio
CREATE TABLE public.espacos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id),
  nome TEXT NOT NULL,
  descricao TEXT,
  capacidade INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.espacos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view espacos"
  ON public.espacos FOR SELECT
  USING (is_platform_admin(auth.uid()) OR belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Admins can insert espacos"
  ON public.espacos FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'::app_role));

CREATE POLICY "Admins can update espacos"
  ON public.espacos FOR UPDATE
  USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'::app_role));

CREATE POLICY "Admins can delete espacos"
  ON public.espacos FOR DELETE
  USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'::app_role));

-- Tabela de reservas
CREATE TABLE public.reservas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  condominio_id UUID NOT NULL REFERENCES public.condominios(id),
  espaco_id UUID NOT NULL REFERENCES public.espacos(id),
  morador_id UUID NOT NULL,
  data DATE NOT NULL,
  horario_inicio TIME NOT NULL,
  horario_fim TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmada',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view reservas"
  ON public.reservas FOR SELECT
  USING (is_platform_admin(auth.uid()) OR belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Morador can insert own reservas"
  ON public.reservas FOR INSERT
  WITH CHECK (auth.uid() = morador_id AND belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Morador can update own reservas"
  ON public.reservas FOR UPDATE
  USING (auth.uid() = morador_id);

CREATE POLICY "Morador can delete own reservas"
  ON public.reservas FOR DELETE
  USING (auth.uid() = morador_id);

CREATE POLICY "Admins can manage reservas"
  ON public.reservas FOR ALL
  USING (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'::app_role))
  WITH CHECK (is_platform_admin(auth.uid()) OR has_role(auth.uid(), condominio_id, 'admin'::app_role));
