CREATE POLICY "Admins can delete bets from their condominium" ON public.copa_palpites
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND (condominio_id = public.copa_palpites.condominio_id OR public.copa_palpites.condominio_id IS NULL)
  )
);
