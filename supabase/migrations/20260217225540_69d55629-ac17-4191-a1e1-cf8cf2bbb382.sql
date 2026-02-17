
-- Create visitor invitations table
CREATE TABLE public.convites_visitante (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id uuid NOT NULL REFERENCES public.condominios(id),
  morador_id uuid NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  nome_visitante text NOT NULL,
  data_visita date NOT NULL,
  horario_inicio time NOT NULL,
  horario_fim time NOT NULL,
  nome_registrado text,
  foto_url text,
  qr_code text UNIQUE,
  usado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pendente',
  CONSTRAINT status_check CHECK (status IN ('pendente', 'registrado', 'usado', 'expirado'))
);

-- Enable RLS
ALTER TABLE public.convites_visitante ENABLE ROW LEVEL SECURITY;

-- Morador can create invites for their condominio
CREATE POLICY "Morador can insert own convites"
ON public.convites_visitante FOR INSERT
WITH CHECK (
  auth.uid() = morador_id
  AND belongs_to_condominio(auth.uid(), condominio_id)
);

-- Morador can view own invites
CREATE POLICY "Morador can view own convites"
ON public.convites_visitante FOR SELECT
USING (auth.uid() = morador_id);

-- Morador can delete own pending invites
CREATE POLICY "Morador can delete own pending convites"
ON public.convites_visitante FOR DELETE
USING (auth.uid() = morador_id AND status = 'pendente');

-- Porteiro can view convites of their condominio (for validation)
CREATE POLICY "Porteiro can view condominio convites"
ON public.convites_visitante FOR SELECT
USING (has_role(auth.uid(), condominio_id, 'porteiro'::app_role));

-- Porteiro can update convites (mark as used)
CREATE POLICY "Porteiro can update condominio convites"
ON public.convites_visitante FOR UPDATE
USING (has_role(auth.uid(), condominio_id, 'porteiro'::app_role));

-- Admin can manage all convites in their condominio
CREATE POLICY "Admin can manage convites"
ON public.convites_visitante FOR ALL
USING (
  is_platform_admin(auth.uid())
  OR has_role(auth.uid(), condominio_id, 'admin'::app_role)
)
WITH CHECK (
  is_platform_admin(auth.uid())
  OR has_role(auth.uid(), condominio_id, 'admin'::app_role)
);

-- Indexes
CREATE INDEX idx_convites_token ON public.convites_visitante(token);
CREATE INDEX idx_convites_morador ON public.convites_visitante(morador_id);
CREATE INDEX idx_convites_condominio ON public.convites_visitante(condominio_id);
