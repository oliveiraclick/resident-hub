
-- Add PIX key fields to banner_precos
ALTER TABLE public.banner_precos
ADD COLUMN chave_pix text,
ADD COLUMN tipo_chave_pix text DEFAULT 'cpf';
