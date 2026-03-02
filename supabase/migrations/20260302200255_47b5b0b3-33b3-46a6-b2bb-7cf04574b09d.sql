
-- Tabela de configuração de preços de banners (gerenciada pelo Super Admin)
CREATE TABLE public.banner_precos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  valor_quinzena numeric NOT NULL DEFAULT 97.00,
  valor_criacao_arte numeric NOT NULL DEFAULT 97.00,
  limite_por_condominio integer NOT NULL DEFAULT 6,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.banner_precos ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ler os preços
CREATE POLICY "Anyone authenticated can view banner_precos"
  ON public.banner_precos FOR SELECT
  TO authenticated
  USING (true);

-- Somente platform_admin pode editar
CREATE POLICY "Platform admins can update banner_precos"
  ON public.banner_precos FOR UPDATE
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can insert banner_precos"
  ON public.banner_precos FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()));

-- Seed com valores iniciais
INSERT INTO public.banner_precos (valor_quinzena, valor_criacao_arte, limite_por_condominio)
VALUES (97.00, 97.00, 6);

-- Tabela de solicitações de banners dos prestadores
CREATE TABLE public.banner_solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prestador_id uuid NOT NULL REFERENCES public.prestadores(id) ON DELETE CASCADE,
  condominio_id uuid NOT NULL REFERENCES public.condominios(id) ON DELETE CASCADE,
  data_inicio date NOT NULL,
  data_fim date NOT NULL,
  tipo_arte text NOT NULL DEFAULT 'propria', -- 'propria' ou 'solicitar'
  imagem_url text,
  status text NOT NULL DEFAULT 'pendente', -- pendente, aprovado, rejeitado, ativo, expirado
  valor_total numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.banner_solicitacoes ENABLE ROW LEVEL SECURITY;

-- Prestador pode ver e inserir suas próprias solicitações
CREATE POLICY "Prestador can view own banner_solicitacoes"
  ON public.banner_solicitacoes FOR SELECT
  USING (
    prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid())
    OR is_platform_admin(auth.uid())
  );

CREATE POLICY "Prestador can insert own banner_solicitacoes"
  ON public.banner_solicitacoes FOR INSERT
  WITH CHECK (
    prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid())
    AND belongs_to_condominio(auth.uid(), condominio_id)
  );

-- Platform admin pode gerenciar tudo
CREATE POLICY "Platform admins can update banner_solicitacoes"
  ON public.banner_solicitacoes FOR UPDATE
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete banner_solicitacoes"
  ON public.banner_solicitacoes FOR DELETE
  USING (is_platform_admin(auth.uid()));

-- Bucket para artes de banner dos prestadores
INSERT INTO storage.buckets (id, name, public) VALUES ('banner-artes', 'banner-artes', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para o bucket
CREATE POLICY "Anyone can view banner artes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banner-artes');

CREATE POLICY "Authenticated can upload banner artes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'banner-artes');
