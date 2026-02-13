-- Allow prestadores to insert their own lancamentos
CREATE POLICY "Prestador can insert own lancamentos"
ON public.financeiro_lancamentos
FOR INSERT
WITH CHECK (
  prestador_id IS NOT NULL
  AND prestador_id IN (
    SELECT id FROM public.prestadores WHERE user_id = auth.uid()
  )
  AND belongs_to_condominio(auth.uid(), condominio_id)
);

-- Allow prestadores to update their own lancamentos
CREATE POLICY "Prestador can update own lancamentos"
ON public.financeiro_lancamentos
FOR UPDATE
USING (
  prestador_id IS NOT NULL
  AND prestador_id IN (
    SELECT id FROM public.prestadores WHERE user_id = auth.uid()
  )
);

-- Allow prestadores to delete their own lancamentos
CREATE POLICY "Prestador can delete own lancamentos"
ON public.financeiro_lancamentos
FOR DELETE
USING (
  prestador_id IS NOT NULL
  AND prestador_id IN (
    SELECT id FROM public.prestadores WHERE user_id = auth.uid()
  )
);