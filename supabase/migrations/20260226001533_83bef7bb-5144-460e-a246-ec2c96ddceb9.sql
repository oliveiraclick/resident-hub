
-- Tabela para armazenar conteúdo editável da Landing Page
CREATE TABLE public.lp_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  secao text NOT NULL,
  chave text NOT NULL,
  valor text NOT NULL DEFAULT '',
  imagem_url text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(secao, chave)
);

-- RLS
ALTER TABLE public.lp_content ENABLE ROW LEVEL SECURITY;

-- Leitura pública (LP é pública)
CREATE POLICY "Anyone can view lp_content" ON public.lp_content
  FOR SELECT USING (true);

-- Apenas platform_admin pode editar
CREATE POLICY "Platform admins can insert lp_content" ON public.lp_content
  FOR INSERT WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can update lp_content" ON public.lp_content
  FOR UPDATE USING (is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete lp_content" ON public.lp_content
  FOR DELETE USING (is_platform_admin(auth.uid()));

-- Inserir conteúdo padrão da LP
-- HERO
INSERT INTO public.lp_content (secao, chave, valor, ordem) VALUES
  ('hero', 'badge', '🆕 Novo: Agora disponível em todo o Brasil', 0),
  ('hero', 'titulo', 'Tudo o que você precisa no seu condomínio,', 1),
  ('hero', 'titulo_destaque', 'em um clique.', 2),
  ('hero', 'subtitulo', 'Conectando moradores aos melhores prestadores de serviço com segurança, agilidade e total transparência. A revolução na gestão da sua rotina chegou.', 3),
  ('hero', 'cta_primario', 'Começar agora gratuitamente', 4),
  ('hero', 'cta_secundario', 'Ver vídeo', 5),
  ('hero', 'social_proof', '+1.000 moradores já estão facilitando suas vidas.', 6);

-- BENEFÍCIOS
INSERT INTO public.lp_content (secao, chave, valor, ordem) VALUES
  ('beneficios', 'subtitulo_secao', 'Por que o Morador.app?', 0),
  ('beneficios', 'titulo_secao', 'Uma experiência completa para o seu dia a dia', 1),
  ('beneficios', 'desc_secao', 'Unimos tecnologia e conveniência para resolver problemas reais que você enfrenta no condomínio.', 2),
  ('beneficios', 'feat1_titulo', 'Segurança Verificada', 3),
  ('beneficios', 'feat1_desc', 'Todos os prestadores passam por um rigoroso processo de checagem de antecedentes e referências.', 4),
  ('beneficios', 'feat2_titulo', 'Comunicação Direta', 5),
  ('beneficios', 'feat2_desc', 'Fale com prestadores e com a administração do seu condomínio de forma rápida e centralizada.', 6),
  ('beneficios', 'feat3_titulo', 'Agendamento Inteligente', 7),
  ('beneficios', 'feat3_desc', 'Reserve áreas comuns ou agende reparos e atendimentos com poucos toques na tela do seu celular.', 8);

-- COMO FUNCIONA
INSERT INTO public.lp_content (secao, chave, valor, ordem) VALUES
  ('como_funciona', 'titulo_secao', 'Como o Morador.app facilita sua vida', 0),
  ('como_funciona', 'passo1_titulo', 'Cadastre-se Gratuitamente', 1),
  ('como_funciona', 'passo1_desc', 'Crie seu perfil como Morador ou Prestador em menos de 2 minutos.', 2),
  ('como_funciona', 'passo2_titulo', 'Busque ou Ofereça Serviços', 3),
  ('como_funciona', 'passo2_desc', 'Encontre o que precisa através de filtros inteligentes ou publique seu serviço.', 4),
  ('como_funciona', 'passo3_titulo', 'Resolva com um Clique', 5),
  ('como_funciona', 'passo3_desc', 'Peça pelo app, avalie o serviço e mantenha tudo organizado no seu histórico.', 6),
  ('como_funciona', 'stat1', '98%', 7),
  ('como_funciona', 'stat1_label', 'Satisfação', 8),
  ('como_funciona', 'stat2', '15min', 9),
  ('como_funciona', 'stat2_label', 'Tempo Resposta', 10);

-- PREÇOS
INSERT INTO public.lp_content (secao, chave, valor, ordem) VALUES
  ('precos', 'titulo_secao', 'Planos para todos', 0),
  ('precos', 'desc_secao', 'Transparência total, sem letras miúdas ou taxas escondidas.', 1),
  ('precos', 'morador_titulo', 'Para Moradores', 2),
  ('precos', 'morador_desc', 'Facilidade para sua rotina.', 3),
  ('precos', 'morador_preco', 'Grátis', 4),
  ('precos', 'morador_preco_sub', 'sempre', 5),
  ('precos', 'morador_feat1', 'Busca de prestadores', 6),
  ('precos', 'morador_feat2', 'Chat ilimitado', 7),
  ('precos', 'morador_feat3', 'Histórico de serviços', 8),
  ('precos', 'morador_feat4', 'Avaliação de profissionais', 9),
  ('precos', 'morador_cta', 'Criar conta grátis', 10),
  ('precos', 'prestador_titulo', 'Para Prestadores', 11),
  ('precos', 'prestador_desc', 'Destaque seu trabalho.', 12),
  ('precos', 'prestador_preco', 'R$ 49', 13),
  ('precos', 'prestador_preco_sub', '/mês', 14),
  ('precos', 'prestador_feat1', 'Perfil verificado', 15),
  ('precos', 'prestador_feat2', 'Prioridade nas buscas', 16),
  ('precos', 'prestador_feat3', 'Leads ilimitados', 17),
  ('precos', 'prestador_feat4', 'Selo de Qualidade', 18),
  ('precos', 'prestador_cta', 'Assinar Pro', 19);

-- DEPOIMENTOS
INSERT INTO public.lp_content (secao, chave, valor, ordem) VALUES
  ('depoimentos', 'titulo_secao', 'O que dizem nossos usuários', 0),
  ('depoimentos', 'dep1_nome', 'Ana Paula', 1),
  ('depoimentos', 'dep1_role', 'Moradora no Cond. Solar', 2),
  ('depoimentos', 'dep1_texto', 'Muito mais fácil de gerenciar os problemas em casa. Encontrei um eletricista em 5 minutos e ele chegou em 20. Sensacional!', 3),
  ('depoimentos', 'dep1_stars', '5', 4),
  ('depoimentos', 'dep2_nome', 'Roberto Silva', 5),
  ('depoimentos', 'dep2_role', 'Encanador Autônomo', 6),
  ('depoimentos', 'dep2_texto', 'Ótimo resultado, meu faturamento aumentou 40% desde que comecei a usar o Morador.app. A confiança do selo verificado faz toda a diferença.', 7),
  ('depoimentos', 'dep2_stars', '5', 8),
  ('depoimentos', 'dep3_nome', 'Carla Mendes', 9),
  ('depoimentos', 'dep3_role', 'Síndica Profissional', 10),
  ('depoimentos', 'dep3_texto', 'Interface muito limpa e intuitiva. Até minha avó conseguiu usar para pedir um chaveiro. Parabéns aos desenvolvedores!', 11),
  ('depoimentos', 'dep3_stars', '5', 12);

-- CTA FINAL
INSERT INTO public.lp_content (secao, chave, valor, ordem) VALUES
  ('cta_final', 'titulo', 'Pronto para transformar seu condomínio?', 0),
  ('cta_final', 'subtitulo', 'Junte-se a milhares de pessoas que já simplificaram sua rotina hoje mesmo.', 1),
  ('cta_final', 'cta_morador', 'Cadastrar como Morador', 2),
  ('cta_final', 'cta_prestador', 'Quero ser um Prestador', 3);

-- FOOTER
INSERT INTO public.lp_content (secao, chave, valor, ordem) VALUES
  ('footer', 'slogan', 'Conectando comunidades, facilitando vidas. O app número #1 para o seu condomínio.', 0),
  ('footer', 'copyright', '© 2024 Morador.app. Todos os direitos reservados.', 1),
  ('footer', 'dev_by', 'Desenvolvido por ia&co. tecnologia', 2);

-- Bucket para imagens da LP
INSERT INTO storage.buckets (id, name, public) VALUES ('lp-images', 'lp-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies para lp-images
CREATE POLICY "Anyone can view lp images" ON storage.objects
  FOR SELECT USING (bucket_id = 'lp-images');

CREATE POLICY "Platform admins can upload lp images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'lp-images' AND is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can update lp images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'lp-images' AND is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete lp images" ON storage.objects
  FOR DELETE USING (bucket_id = 'lp-images' AND is_platform_admin(auth.uid()));
