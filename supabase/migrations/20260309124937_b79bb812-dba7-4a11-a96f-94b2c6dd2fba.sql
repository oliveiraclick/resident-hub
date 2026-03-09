
-- Drop and recreate FK constraints with ON DELETE CASCADE for eventos_amigos children

ALTER TABLE public.evento_participantes
  DROP CONSTRAINT evento_participantes_evento_id_fkey,
  ADD CONSTRAINT evento_participantes_evento_id_fkey
    FOREIGN KEY (evento_id) REFERENCES public.eventos_amigos(id) ON DELETE CASCADE;

ALTER TABLE public.evento_itens
  DROP CONSTRAINT evento_itens_evento_id_fkey,
  ADD CONSTRAINT evento_itens_evento_id_fkey
    FOREIGN KEY (evento_id) REFERENCES public.eventos_amigos(id) ON DELETE CASCADE;

ALTER TABLE public.evento_despesas
  DROP CONSTRAINT evento_despesas_evento_id_fkey,
  ADD CONSTRAINT evento_despesas_evento_id_fkey
    FOREIGN KEY (evento_id) REFERENCES public.eventos_amigos(id) ON DELETE CASCADE;

ALTER TABLE public.evento_pagamentos
  DROP CONSTRAINT evento_pagamentos_evento_id_fkey,
  ADD CONSTRAINT evento_pagamentos_evento_id_fkey
    FOREIGN KEY (evento_id) REFERENCES public.eventos_amigos(id) ON DELETE CASCADE;

ALTER TABLE public.evento_cotacoes
  DROP CONSTRAINT evento_cotacoes_evento_id_fkey,
  ADD CONSTRAINT evento_cotacoes_evento_id_fkey
    FOREIGN KEY (evento_id) REFERENCES public.eventos_amigos(id) ON DELETE CASCADE;
