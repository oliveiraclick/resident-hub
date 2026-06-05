-- Function to process or update a palpite for the bolao
-- If it's a 'bolao' type, we check if the user has already paid the 20 BRL fee for THIS season/type.
-- If they have, any subsequent 'bolao' palpite is free (validated automatically).

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
    -- Get current balance
    SELECT saldo INTO v_saldo FROM public.profiles WHERE user_id = p_user_id;
    
    -- Check if it's bolao and if already paid
    IF p_tipo = 'bolao' THEN
        SELECT EXISTS (
            SELECT 1 FROM public.copa_palpites 
            WHERE user_id = p_user_id 
            AND tipo = 'bolao' 
            AND status_pagamento = 'pago'
        ) INTO v_has_paid_bolao;
        
        IF v_has_paid_bolao THEN
            -- User already paid the 20 BRL fee for bolao. 
            -- Just insert or update the palpite without deducting balance.
            INSERT INTO public.copa_palpites (
                user_id, condominio_id, jogo_id, tipo, palpite_valor, status_pagamento, valor_pago, pago, metodo_pagamento
            ) VALUES (
                p_user_id, p_condominio_id, p_jogo_id, p_tipo, p_palpite_valor, 'pago', 0, true, 'carteira'
            )
            ON CONFLICT (user_id, jogo_id, tipo) 
            DO UPDATE SET 
                palpite_valor = EXCLUDED.palpite_valor,
                updated_at = now();
            RETURN;
        END IF;
    END IF;

    -- Normal payment flow
    IF v_saldo < p_valor THEN
        RAISE EXCEPTION 'Saldo insuficiente';
    END IF;

    -- Deduct balance
    UPDATE public.profiles SET saldo = saldo - p_valor WHERE user_id = p_user_id;

    -- Insert or update palpite
    INSERT INTO public.copa_palpites (
        user_id, condominio_id, jogo_id, tipo, palpite_valor, status_pagamento, valor_pago, pago, metodo_pagamento
    ) VALUES (
        p_user_id, p_condominio_id, p_jogo_id, p_tipo, p_palpite_valor, 'pago', p_valor, true, 'carteira'
    )
    ON CONFLICT (user_id, jogo_id, tipo) 
    DO UPDATE SET 
        palpite_valor = EXCLUDED.palpite_valor,
        updated_at = now();

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
