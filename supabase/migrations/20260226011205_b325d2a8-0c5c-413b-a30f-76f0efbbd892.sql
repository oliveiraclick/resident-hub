CREATE TABLE public.contato_mensagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Allow anyone (anonymous) to insert
ALTER TABLE public.contato_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa pode enviar mensagem" ON public.contato_mensagens
  FOR INSERT WITH CHECK (true);
