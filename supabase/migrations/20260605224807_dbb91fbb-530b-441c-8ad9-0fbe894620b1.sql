-- Re-definindo a função com a lógica correta para múltiplos jogos no bolão
CREATE OR REPLACE FUNCTION public.process_palpite_with_balance(
    p_user_id uuid,
    p_condominio_id uuid,
    p_jogo_id uuid,
    p_tipo text,
    p_palpite_valor jsonb,
    p_valor numeric
) RETURNS void AS $$
DECLARE
    v_saldo numeric;
    v_has_paid_bolao boolean;
BEGIN
    -- Se for bolão, verifica se o usuário já pagou a taxa de R$ 20,00 alguma vez
    IF p_tipo = 'bolao' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.copa_palpites 
            WHERE user_id = p_user_id 
            AND tipo = 'bolao' 
            AND status_pagamento = 'pago'
            AND valor_pago = 20
        ) INTO v_has_paid_bolao;
        
        IF v_has_paid_bolao THEN
            -- Se já pagou, apenas insere/atualiza o palpite para este jogo específico com valor_pago = 0
            INSERT INTO public.copa_palpites (
                user_id, condominio_id, jogo_id, tipo, palpite_valor, status_pagamento, valor_pago, pago, metodo_pagamento
            ) VALUES (
                p_user_id, p_condominio_id, p_jogo_id, p_tipo, p_palpite_valor, 'pago', 0, true, 'carteira'
            )
            ON CONFLICT (id) DO UPDATE SET -- Usando ID se disponível ou apenas inserindo se não houver constraint unique
            -- Nota: Como não há constraint unique multi-coluna, vamos apenas inserir.
            -- Se houver necessidade de atualizar, o app deve enviar o ID ou deletar antes.
            -- Mas para simplificar e garantir funcionamento imediato:
            palpite_valor = EXCLUDED.palpite_valor;
            
            -- Se não houver ON CONFLICT efetivo, deletamos o anterior do mesmo jogo/tipo para o usuário
            DELETE FROM public.copa_palpites 
            WHERE user_id = p_user_id 
            AND jogo_id = p_jogo_id 
            AND tipo = p_tipo 
            AND id != (SELECT id FROM public.copa_palpites WHERE user_id = p_user_id AND jogo_id = p_jogo_id AND tipo = p_tipo ORDER BY created_at DESC LIMIT 1);
            
            RETURN;
        END IF;
    END IF;

    -- Fluxo normal de pagamento
    SELECT saldo INTO v_saldo FROM public.profiles WHERE user_id = p_user_id;
    
    IF v_saldo < p_valor THEN
        RAISE EXCEPTION 'Saldo insuficiente: você possui R$ %, mas a aposta custa R$ %', v_saldo, p_valor;
    END IF;

    UPDATE public.profiles SET saldo = saldo - p_valor WHERE user_id = p_user_id;

    INSERT INTO public.copa_palpites (
        user_id, condominio_id, jogo_id, tipo, palpite_valor, status_pagamento, valor_pago, pago, metodo_pagamento
    ) VALUES (
        p_user_id, p_condominio_id, p_jogo_id, p_tipo, p_palpite_valor, 'pago', p_valor, true, 'carteira'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
