ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.profiles 
SET telefone = '(00) 00000-0000' 
WHERE user_id = '77b9315f-e97d-4e86-85b6-2dee2995cd29' AND telefone IS NULL;