-- Function to calculate points for a specific bet
CREATE OR REPLACE FUNCTION public.calcular_pontos_palpite(
    p_placar_home_jogo INTEGER,
    p_placar_away_jogo INTEGER,
    p_palpite_valor JSONB
) RETURNS INTEGER AS $$
DECLARE
    v_h_palpite INTEGER;
    v_a_palpite INTEGER;
    v_pontos INTEGER := 0;
BEGIN
    -- Extract values from JSONB {"h": X, "a": Y}
    v_h_palpite := (p_palpite_valor->>'h')::INTEGER;
    v_a_palpite := (p_palpite_valor->>'a')::INTEGER;

    -- 1. Exact score (10 points)
    IF v_h_palpite = p_placar_home_jogo AND v_a_palpite = p_placar_away_jogo THEN
        v_pontos := 10;
    -- 2. Correct winner/draw but wrong score (5 points)
    ELSIF (v_h_palpite > v_a_palpite AND p_placar_home_jogo > p_placar_away_jogo) OR -- Home win
          (v_h_palpite < v_a_palpite AND p_placar_home_jogo < p_placar_away_jogo) OR -- Away win
          (v_h_palpite = v_a_palpite AND p_placar_home_jogo = p_placar_away_jogo)    -- Draw
    THEN
        v_pontos := 5;
    END IF;

    RETURN v_pontos;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to update all bets when a game ends
CREATE OR REPLACE FUNCTION public.fn_atualizar_pontos_copa()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run if the score was updated and the game is finalized
    IF (NEW.status = 'finalizado') AND 
       (OLD.placar_home IS DISTINCT FROM NEW.placar_home OR OLD.placar_away IS DISTINCT FROM NEW.placar_away OR OLD.status IS DISTINCT FROM NEW.status) 
    THEN
        UPDATE public.copa_palpites
        SET pontos_ganhos = calcular_pontos_palpite(NEW.placar_home, NEW.placar_away, palpite_valor)
        WHERE jogo_id = NEW.id 
          AND status_pagamento = 'pago';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS tr_atualizar_pontos_copa ON public.copa_jogos;
CREATE TRIGGER tr_atualizar_pontos_copa
AFTER UPDATE ON public.copa_jogos
FOR EACH ROW
EXECUTE FUNCTION public.fn_atualizar_pontos_copa();
