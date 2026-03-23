-- Allow public (anon) to read active produtos for public storefronts
CREATE POLICY "Public can view active produtos"
ON public.produtos
FOR SELECT
TO anon
USING (status = 'ativo');

-- Allow public (anon) to view cardapio items for public storefronts
CREATE POLICY "Public can view cardapio_itens"
ON public.cardapio_itens
FOR SELECT
TO anon
USING (disponivel = true);

-- Allow public (anon) to view cardapio categories
CREATE POLICY "Public can view cardapio_categorias"
ON public.cardapio_categorias
FOR SELECT
TO anon
USING (true);
