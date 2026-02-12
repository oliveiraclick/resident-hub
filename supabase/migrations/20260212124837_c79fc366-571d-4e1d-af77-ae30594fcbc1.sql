
-- ============================================================
-- 1. unidades: renomear user_id → morador_id
-- ============================================================
ALTER TABLE public.unidades RENAME COLUMN user_id TO morador_id;

-- ============================================================
-- 2. produtos: remover user_id, adicionar prestador_id FK prestadores
-- ============================================================
-- Dropar policies que referenciam user_id
DROP POLICY IF EXISTS "Users can insert own produtos" ON public.produtos;
DROP POLICY IF EXISTS "Users can update own produtos" ON public.produtos;
DROP POLICY IF EXISTS "Users can delete own produtos" ON public.produtos;

-- Remover coluna user_id
ALTER TABLE public.produtos DROP COLUMN user_id;

-- Adicionar prestador_id
ALTER TABLE public.produtos ADD COLUMN prestador_id UUID REFERENCES public.prestadores(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE public.produtos ALTER COLUMN prestador_id DROP DEFAULT;

-- Recriar policies para produtos (prestador gerencia próprios produtos)
CREATE POLICY "Prestador can insert own produtos"
  ON public.produtos FOR INSERT TO authenticated
  WITH CHECK (
    prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid())
    AND public.belongs_to_condominio(auth.uid(), condominio_id)
  );

CREATE POLICY "Prestador can update own produtos"
  ON public.produtos FOR UPDATE TO authenticated
  USING (prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid()));

CREATE POLICY "Prestador can delete own produtos"
  ON public.produtos FOR DELETE TO authenticated
  USING (prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid()));

-- ============================================================
-- 3. desapegos: renomear user_id → morador_id
-- ============================================================
-- Dropar policies que referenciam user_id
DROP POLICY IF EXISTS "Users can insert own desapegos" ON public.desapegos;
DROP POLICY IF EXISTS "Users can update own desapegos" ON public.desapegos;
DROP POLICY IF EXISTS "Users can delete own desapegos" ON public.desapegos;

ALTER TABLE public.desapegos RENAME COLUMN user_id TO morador_id;

-- Recriar policies com morador_id
CREATE POLICY "Morador can insert own desapegos"
  ON public.desapegos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = morador_id AND public.belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Morador can update own desapegos"
  ON public.desapegos FOR UPDATE TO authenticated
  USING (auth.uid() = morador_id);

CREATE POLICY "Morador can delete own desapegos"
  ON public.desapegos FOR DELETE TO authenticated
  USING (auth.uid() = morador_id);

-- ============================================================
-- 4. financeiro_lancamentos: remover unidade_id, adicionar prestador_id
-- ============================================================
ALTER TABLE public.financeiro_lancamentos DROP COLUMN unidade_id;
ALTER TABLE public.financeiro_lancamentos ADD COLUMN prestador_id UUID REFERENCES public.prestadores(id) ON DELETE SET NULL;
