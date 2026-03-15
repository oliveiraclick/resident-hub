
-- Create sub_especialidades table for crowd-sourced sub-specialties
CREATE TABLE public.sub_especialidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_nome text NOT NULL,
  nome text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(categoria_nome, nome)
);

-- Enable RLS
ALTER TABLE public.sub_especialidades ENABLE ROW LEVEL SECURITY;

-- Anyone can view sub_especialidades
CREATE POLICY "Anyone can view sub_especialidades"
  ON public.sub_especialidades FOR SELECT
  TO public USING (true);

-- Authenticated users can insert sub_especialidades
CREATE POLICY "Authenticated can insert sub_especialidades"
  ON public.sub_especialidades FOR INSERT
  TO authenticated WITH CHECK (true);

-- Platform admins can manage sub_especialidades
CREATE POLICY "Platform admins can manage sub_especialidades"
  ON public.sub_especialidades FOR ALL
  TO public USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- Add sub_especialidade column to prestadores
ALTER TABLE public.prestadores ADD COLUMN sub_especialidade text;
