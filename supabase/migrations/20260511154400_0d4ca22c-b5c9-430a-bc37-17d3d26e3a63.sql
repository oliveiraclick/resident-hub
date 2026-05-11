-- Adicionar novas colunas à tabela de espaços
ALTER TABLE public.espacos 
ADD COLUMN IF NOT EXISTS regras TEXT,
ADD COLUMN IF NOT EXISTS preco NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS imagem_url TEXT;

-- Inserir dados mock para teste (assumindo que existe pelo menos um condomínio)
DO $$ 
DECLARE 
    v_condominio_id UUID;
BEGIN
    SELECT id INTO v_condominio_id FROM public.condominios LIMIT 1;
    
    IF v_condominio_id IS NOT NULL THEN
        INSERT INTO public.espacos (condominio_id, nome, categoria, descricao, capacidade, preco, regras, imagem_url)
        VALUES 
        (v_condominio_id, 'Quiosque 01', 'quiosque', 'Quiosque completo com churrasqueira e vista para o lago.', 15, 50.00, 'Proibido som alto após as 22h. Limpeza inclusa.', 'https://images.unsplash.com/photo-1519690889869-e705e59f72e1?auto=format&fit=crop&w=800&q=80'),
        (v_condominio_id, 'Salão Nobre', 'salao', 'Espaço amplo para festas e eventos corporativos, climatizado.', 100, 350.00, 'Necessário agendamento com 48h de antecedência.', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80'),
        (v_condominio_id, 'Quadra de Tênis', 'quadra', 'Quadra de saibro profissional com iluminação noturna.', 4, 20.00, 'Uso obrigatório de calçado adequado.', 'https://images.unsplash.com/photo-1595435064214-0df213032470?auto=format&fit=crop&w=800&q=80');
    END IF;
END $$;
