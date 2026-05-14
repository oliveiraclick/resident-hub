-- Adicionar política para permitir que o sistema (ou o próprio morador) exclua reservas expiradas
CREATE POLICY "Moradores podem excluir suas próprias reservas expiradas" 
ON public.reservas 
FOR DELETE 
USING (auth.uid() = morador_id AND (status = 'pre_reserva' AND expira_em < now()));

-- Garantir que o campo expira_em seja respeitado (embora o popup cuide disso, é bom ter no DB se possível, mas como não temos cron job direto aqui, focamos na limpeza via app)
-- A lógica de expiração já está sendo tratada no frontend e será reforçada na visualização.
