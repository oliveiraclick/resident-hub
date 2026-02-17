
-- Tabela global de categorias de serviço
CREATE TABLE public.categorias_servico (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL UNIQUE,
  icone text NOT NULL DEFAULT 'Wrench',
  grupo text NOT NULL DEFAULT 'Para sua Casa',
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categorias_servico ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read
CREATE POLICY "Anyone can view categorias_servico"
ON public.categorias_servico
FOR SELECT
USING (true);

-- Only platform_admin can manage
CREATE POLICY "Platform admins can insert categorias_servico"
ON public.categorias_servico
FOR INSERT
WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can update categorias_servico"
ON public.categorias_servico
FOR UPDATE
USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete categorias_servico"
ON public.categorias_servico
FOR DELETE
USING (is_platform_admin(auth.uid()));

-- Seed with current categories
INSERT INTO public.categorias_servico (nome, icone, grupo, ordem) VALUES
  ('Eletricista', 'Zap', 'Para sua Casa', 1),
  ('Encanador', 'Droplets', 'Para sua Casa', 2),
  ('Pintura', 'Paintbrush', 'Para sua Casa', 3),
  ('Reparos', 'Hammer', 'Para sua Casa', 4),
  ('Jardinagem', 'TreePine', 'Para sua Casa', 5),
  ('Faxina', 'SprayCan', 'Para sua Casa', 6),
  ('Limpeza', 'Sparkles', 'Para sua Casa', 7),
  ('Móveis', 'Sofa', 'Para sua Casa', 8),
  ('Ar Condicionado', 'AirVent', 'Para sua Casa', 9),
  ('Dedetização', 'Bug', 'Para sua Casa', 10),
  ('Internet', 'Wifi', 'Tecnologia', 11),
  ('Eletrônicos', 'Smartphone', 'Tecnologia', 12),
  ('Confeitaria', 'UtensilsCrossed', 'Alimentação', 13),
  ('Marmitas', 'UtensilsCrossed', 'Alimentação', 14),
  ('Costura', 'Scissors', 'Pra Você', 15),
  ('Lavanderia', 'Shirt', 'Pra Você', 16),
  ('Personal', 'Dumbbell', 'Pra Você', 17),
  ('Mecânico', 'Car', 'Para seu Veículo', 18),
  ('Lavagem', 'Car', 'Para seu Veículo', 19),
  ('Mudança', 'Truck', 'Mudança', 20),
  ('Carreto', 'Truck', 'Mudança', 21),
  ('Pet Shop', 'PawPrint', 'Para seu Pet', 22),
  ('Dog Walker', 'PawPrint', 'Para seu Pet', 23);
