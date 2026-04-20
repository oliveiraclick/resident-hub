ALTER TABLE public.prestador_precos
ADD COLUMN IF NOT EXISTS link_pagamento_automatico text;

UPDATE public.prestador_precos
SET link_pagamento_automatico = 'https://pay.kiwify.com.br/mL9H7dv'
WHERE link_pagamento_automatico IS NULL;