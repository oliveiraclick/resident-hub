ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS termos_aceitos_em timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS condicoes_aceitas_em timestamp with time zone DEFAULT NULL;