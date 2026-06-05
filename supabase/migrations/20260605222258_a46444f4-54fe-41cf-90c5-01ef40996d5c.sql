CREATE OR REPLACE FUNCTION public.process_palpite_with_balance(
    p_user_id UUID,
    p_condominio_id UUID,
    p_jogo_id UUID,
    p_tipo TEXT,
    p_palpite_valor JSONB,
    p_valor NUMERIC
) RETURNS VOID AS $$
DECLARE
    v_saldo NUMERIC;
BEGIN
    -- Get current balance
    SELECT saldo INTO v_saldo FROM public.profiles WHERE user_id = p_user_id;
    
    IF v_saldo IS NULL OR v_saldo < p_valor THEN
        RAISE EXCEPTION 'Saldo insuficiente';
    END IF;
    
    -- Deduct balance
    UPDATE public.profiles 
    SET saldo = saldo - p_valor 
    WHERE user_id = p_user_id;
    
    -- Insert bet as paid
    INSERT INTO public.copa_palpites (
        user_id, 
        condominio_id, 
        jogo_id, 
        tipo, 
        palpite_valor, 
        valor_pago, 
        status_pagamento, 
        pago, 
        metodo_pagamento
    ) VALUES (
        p_user_id, 
        p_condominio_id, 
        p_jogo_id, 
        p_tipo, 
        p_palpite_valor, 
        p_valor, 
        'pago', 
        true, 
        'carteira'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.process_palpite_with_balance TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_palpite_with_balance TO service_role;
