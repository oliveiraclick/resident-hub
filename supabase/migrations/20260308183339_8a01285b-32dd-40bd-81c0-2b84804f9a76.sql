
-- Tabela lojas (1 por prestador)
CREATE TABLE public.lojas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  condominio_id uuid NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  banner_url text,
  horario_funcionamento text,
  whatsapp text,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(prestador_id)
);

ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;

-- Prestador pode ver/gerenciar própria loja
CREATE POLICY "Prestador can select own loja" ON public.lojas
  FOR SELECT TO authenticated
  USING (
    prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid())
    OR belongs_to_condominio(auth.uid(), condominio_id)
    OR is_platform_admin(auth.uid())
  );

CREATE POLICY "Prestador can insert own loja" ON public.lojas
  FOR INSERT TO authenticated
  WITH CHECK (
    prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid())
    AND belongs_to_condominio(auth.uid(), condominio_id)
  );

CREATE POLICY "Prestador can update own loja" ON public.lojas
  FOR UPDATE TO authenticated
  USING (
    prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid())
  );

CREATE POLICY "Prestador can delete own loja" ON public.lojas
  FOR DELETE TO authenticated
  USING (
    prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid())
    OR is_platform_admin(auth.uid())
  );

-- Tabela pedidos
CREATE TABLE public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id uuid NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  condominio_id uuid NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  morador_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  observacoes text,
  valor_total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Morador pode ver/criar próprios pedidos
CREATE POLICY "Morador can select own pedidos" ON public.pedidos
  FOR SELECT TO authenticated
  USING (
    morador_id = auth.uid()
    OR loja_id IN (
      SELECT id FROM public.lojas WHERE prestador_id IN (
        SELECT id FROM public.prestadores WHERE user_id = auth.uid()
      )
    )
    OR is_platform_admin(auth.uid())
  );

CREATE POLICY "Morador can insert own pedidos" ON public.pedidos
  FOR INSERT TO authenticated
  WITH CHECK (
    morador_id = auth.uid()
    AND belongs_to_condominio(auth.uid(), condominio_id)
  );

-- Prestador pode atualizar status dos pedidos da sua loja
CREATE POLICY "Prestador can update pedidos of own loja" ON public.pedidos
  FOR UPDATE TO authenticated
  USING (
    loja_id IN (
      SELECT id FROM public.lojas WHERE prestador_id IN (
        SELECT id FROM public.prestadores WHERE user_id = auth.uid()
      )
    )
    OR morador_id = auth.uid()
  );

-- Tabela pedido_itens
CREATE TABLE public.pedido_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  quantidade integer NOT NULL DEFAULT 1,
  preco_unitario numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Morador can select own pedido_itens" ON public.pedido_itens
  FOR SELECT TO authenticated
  USING (
    pedido_id IN (SELECT id FROM public.pedidos WHERE morador_id = auth.uid())
    OR pedido_id IN (
      SELECT p.id FROM public.pedidos p
      JOIN public.lojas l ON l.id = p.loja_id
      JOIN public.prestadores pr ON pr.id = l.prestador_id
      WHERE pr.user_id = auth.uid()
    )
    OR is_platform_admin(auth.uid())
  );

CREATE POLICY "Morador can insert own pedido_itens" ON public.pedido_itens
  FOR INSERT TO authenticated
  WITH CHECK (
    pedido_id IN (SELECT id FROM public.pedidos WHERE morador_id = auth.uid())
  );
