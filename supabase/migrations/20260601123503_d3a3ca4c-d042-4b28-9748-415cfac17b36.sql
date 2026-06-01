ALTER TABLE public.copa_jogos 
ADD CONSTRAINT unique_match UNIQUE (time_home, time_away, data_jogo);