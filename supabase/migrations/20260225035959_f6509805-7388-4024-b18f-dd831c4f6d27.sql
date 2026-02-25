CREATE POLICY "Prestador can delete own servicos"
ON public.servicos
FOR DELETE
TO authenticated
USING (
  prestador_id IN (
    SELECT id FROM public.prestadores WHERE user_id = auth.uid()
  )
);