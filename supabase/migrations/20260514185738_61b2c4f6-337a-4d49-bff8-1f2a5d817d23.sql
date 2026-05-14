-- Criar um índice de exclusividade para evitar reservas duplicadas no mesmo espaço, data e horário
-- Ignora reservas canceladas ou expiradas
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservas_exclusividade_horario 
ON public.reservas (espaco_id, data, horario_inicio) 
WHERE (status IN ('confirmada', 'pre_reserva'));

-- Criar um índice de exclusividade para reservas de dia inteiro (Salão/Quiosque)
-- Isso garante que apenas uma reserva (confirmada ou pré) exista para o dia todo
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservas_exclusividade_dia_inteiro
ON public.reservas (espaco_id, data)
WHERE (status IN ('confirmada', 'pre_reserva') AND horario_inicio = '09:00:00' AND horario_fim = '22:00:00');
