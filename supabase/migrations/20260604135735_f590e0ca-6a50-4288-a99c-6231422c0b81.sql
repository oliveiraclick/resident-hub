INSERT INTO public.copa_jogos (time_home, time_away, data_jogo, rodada, status) VALUES
('Brasil', 'Alemanha', now() + interval '2 days', 'Rodada 1', 'agendado'),
('Argentina', 'França', now() + interval '3 days', 'Rodada 1', 'agendado'),
('Portugal', 'Espanha', now() + interval '4 days', 'Rodada 1', 'agendado'),
('Inglaterra', 'Holanda', now() + interval '5 days', 'Rodada 1', 'agendado'),
('Brasil', 'Sérvia', now() + interval '10 days', 'Rodada 2', 'agendado'),
('Uruguai', 'Coreia do Sul', now() + interval '12 days', 'Rodada 1', 'agendado')
ON CONFLICT DO NOTHING;