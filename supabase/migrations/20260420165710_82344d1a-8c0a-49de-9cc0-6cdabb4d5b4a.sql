-- Permitir que membros do condomínio vejam avaliações para exibir nos cards de prestadores
CREATE POLICY "Members can view condominio avaliacoes"
ON public.avaliacoes
FOR SELECT
TO authenticated
USING (belongs_to_condominio(auth.uid(), condominio_id));