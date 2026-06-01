-- Create matches table
CREATE TABLE public.copa_jogos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    time_home TEXT NOT NULL,
    time_away TEXT NOT NULL,
    data_jogo TIMESTAMP WITH TIME ZONE NOT NULL,
    rodada TEXT,
    placar_home INTEGER,
    placar_away INTEGER,
    status TEXT DEFAULT 'agendado', -- agendado, em_andamento, finalizado
    is_brasil_game BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create configuration table
CREATE TABLE public.copa_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sponsors table
CREATE TABLE public.copa_sponsors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    logo_url TEXT,
    valor_contribuicao DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create bets table
CREATE TABLE public.copa_palpites (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    condominio_id UUID,
    jogo_id UUID REFERENCES public.copa_jogos,
    tipo TEXT NOT NULL, -- placar_exato, vencedor, campeao, artilheiro
    palpite_valor JSONB NOT NULL, -- {home: 2, away: 1} or {jogador: "Neymar"}
    valor_pago DECIMAL(10,2) NOT NULL DEFAULT 0,
    status_pagamento TEXT DEFAULT 'pendente', -- pendente, pago, cancelado
    pontos_ganhos INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.copa_jogos TO authenticated;
GRANT ALL ON public.copa_jogos TO service_role;

GRANT SELECT ON public.copa_config TO authenticated;
GRANT ALL ON public.copa_config TO service_role;

GRANT SELECT ON public.copa_sponsors TO authenticated;
GRANT ALL ON public.copa_sponsors TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.copa_palpites TO authenticated;
GRANT ALL ON public.copa_palpites TO service_role;

-- RLS
ALTER TABLE public.copa_jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copa_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copa_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copa_palpites ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Jogos viewable by everyone" ON public.copa_jogos FOR SELECT USING (true);
CREATE POLICY "Config viewable by everyone" ON public.copa_config FOR SELECT USING (true);
CREATE POLICY "Sponsors viewable by everyone" ON public.copa_sponsors FOR SELECT USING (true);

CREATE POLICY "Users can view their own bets" 
ON public.copa_palpites FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bets" 
ON public.copa_palpites FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Insert default config
INSERT INTO public.copa_config (key, value) VALUES 
('precos', '{"jogo_brasil": 20.00, "placar_exato": 10.00, "artilheiro": 10.00, "campeao": 50.00}'),
('pix_key', '{"chave": "seu-pix@aqui.com", "beneficiario": "Condomínio Master"}');
