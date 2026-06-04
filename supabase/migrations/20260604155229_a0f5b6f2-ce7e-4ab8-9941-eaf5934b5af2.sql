-- Políticas para copa_palpites
CREATE POLICY "Admins can view bets from their condominium" ON public.copa_palpites
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND (condominio_id = public.copa_palpites.condominio_id OR public.copa_palpites.condominio_id IS NULL)
  )
);

CREATE POLICY "Admins can update bets from their condominium" ON public.copa_palpites
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin' 
    AND (condominio_id = public.copa_palpites.condominio_id OR public.copa_palpites.condominio_id IS NULL)
  )
);

-- Políticas para profiles
-- Permite que administradores vejam perfis de usuários que tenham qualquer cargo no mesmo condomínio
CREATE POLICY "Admins can view profiles from their condominium" ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles admin_role
    JOIN public.user_roles user_role ON admin_role.condominio_id = user_role.condominio_id
    WHERE admin_role.user_id = auth.uid() 
    AND admin_role.role = 'admin'
    AND user_role.user_id = public.profiles.user_id
  )
);
