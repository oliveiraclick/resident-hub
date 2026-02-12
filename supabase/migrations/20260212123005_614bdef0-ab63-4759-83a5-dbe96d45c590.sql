
-- 1. Enum de roles
CREATE TYPE public.app_role AS ENUM ('morador', 'prestador', 'admin');

-- 2. Tabela de condomínios
CREATE TABLE public.condominios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabela de perfis (profiles)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL DEFAULT '',
  telefone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabela de roles por condomínio (multi-tenant)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, condominio_id, role)
);

-- 5. Unidades
CREATE TABLE public.unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE NOT NULL,
  bloco TEXT,
  numero TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Prestadores
CREATE TABLE public.prestadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  especialidade TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Serviços
CREATE TABLE public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE NOT NULL,
  prestador_id UUID REFERENCES public.prestadores(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Produtos
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Desapegos
CREATE TABLE public.desapegos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Lotes
CREATE TABLE public.lotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Pacotes
CREATE TABLE public.pacotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE NOT NULL,
  unidade_id UUID REFERENCES public.unidades(id) ON DELETE CASCADE NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  recebido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Avaliações
CREATE TABLE public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE NOT NULL,
  avaliador_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  avaliado_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Financeiro - Lançamentos
CREATE TABLE public.financeiro_lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID REFERENCES public.condominios(id) ON DELETE CASCADE NOT NULL,
  unidade_id UUID REFERENCES public.unidades(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  vencimento DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ========== RLS ==========

-- Enable RLS on all tables
ALTER TABLE public.condominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desapegos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_lancamentos ENABLE ROW LEVEL SECURITY;

-- ========== Security definer functions ==========

-- Check if user has a specific role in a condominio
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _condominio_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND condominio_id = _condominio_id
      AND role = _role
  )
$$;

-- Check if user belongs to a condominio (any role)
CREATE OR REPLACE FUNCTION public.belongs_to_condominio(_user_id UUID, _condominio_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND condominio_id = _condominio_id
  )
$$;

-- Get condominio IDs for a user
CREATE OR REPLACE FUNCTION public.get_user_condominio_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT condominio_id FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- ========== Profiles RLS ==========
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ========== Condominios RLS ==========
CREATE POLICY "Users can view their condominios"
  ON public.condominios FOR SELECT
  TO authenticated
  USING (id IN (SELECT public.get_user_condominio_ids(auth.uid())));

CREATE POLICY "Admins can insert condominios"
  ON public.condominios FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update their condominios"
  ON public.condominios FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), id, 'admin'));

-- ========== User Roles RLS ==========
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view roles in their condominio"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), condominio_id, 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), condominio_id, 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), condominio_id, 'admin'));

-- ========== Multi-tenant RLS (todas as tabelas com condominio_id) ==========

-- Macro: users see records in their condominios
-- Unidades
CREATE POLICY "Members can view unidades"
  ON public.unidades FOR SELECT TO authenticated
  USING (public.belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Admins can manage unidades"
  ON public.unidades FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), condominio_id, 'admin'));

CREATE POLICY "Admins can update unidades"
  ON public.unidades FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), condominio_id, 'admin'));

CREATE POLICY "Admins can delete unidades"
  ON public.unidades FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), condominio_id, 'admin'));

-- Prestadores
CREATE POLICY "Members can view prestadores"
  ON public.prestadores FOR SELECT TO authenticated
  USING (public.belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Own prestador can insert"
  ON public.prestadores FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Own prestador can update"
  ON public.prestadores FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete prestadores"
  ON public.prestadores FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), condominio_id, 'admin'));

-- Servicos
CREATE POLICY "Members can view servicos"
  ON public.servicos FOR SELECT TO authenticated
  USING (public.belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Prestador can insert servicos"
  ON public.servicos FOR INSERT TO authenticated
  WITH CHECK (public.belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Prestador can update own servicos"
  ON public.servicos FOR UPDATE TO authenticated
  USING (prestador_id IN (SELECT id FROM public.prestadores WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete servicos"
  ON public.servicos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), condominio_id, 'admin'));

-- Produtos
CREATE POLICY "Members can view produtos"
  ON public.produtos FOR SELECT TO authenticated
  USING (public.belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Users can insert own produtos"
  ON public.produtos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Users can update own produtos"
  ON public.produtos FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own produtos"
  ON public.produtos FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Desapegos
CREATE POLICY "Members can view desapegos"
  ON public.desapegos FOR SELECT TO authenticated
  USING (public.belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Users can insert own desapegos"
  ON public.desapegos FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Users can update own desapegos"
  ON public.desapegos FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own desapegos"
  ON public.desapegos FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Lotes
CREATE POLICY "Members can view lotes"
  ON public.lotes FOR SELECT TO authenticated
  USING (public.belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Admins can manage lotes"
  ON public.lotes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), condominio_id, 'admin'));

CREATE POLICY "Admins can update lotes"
  ON public.lotes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), condominio_id, 'admin'));

CREATE POLICY "Admins can delete lotes"
  ON public.lotes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), condominio_id, 'admin'));

-- Pacotes
CREATE POLICY "Members can view pacotes"
  ON public.pacotes FOR SELECT TO authenticated
  USING (public.belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Admins can insert pacotes"
  ON public.pacotes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), condominio_id, 'admin'));

CREATE POLICY "Admins can update pacotes"
  ON public.pacotes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), condominio_id, 'admin'));

CREATE POLICY "Admins can delete pacotes"
  ON public.pacotes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), condominio_id, 'admin'));

-- Avaliacoes
CREATE POLICY "Members can view avaliacoes"
  ON public.avaliacoes FOR SELECT TO authenticated
  USING (public.belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Users can insert own avaliacoes"
  ON public.avaliacoes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = avaliador_id AND public.belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Users can update own avaliacoes"
  ON public.avaliacoes FOR UPDATE TO authenticated
  USING (auth.uid() = avaliador_id);

CREATE POLICY "Users can delete own avaliacoes"
  ON public.avaliacoes FOR DELETE TO authenticated
  USING (auth.uid() = avaliador_id);

-- Financeiro Lancamentos
CREATE POLICY "Members can view lancamentos"
  ON public.financeiro_lancamentos FOR SELECT TO authenticated
  USING (public.belongs_to_condominio(auth.uid(), condominio_id));

CREATE POLICY "Admins can insert lancamentos"
  ON public.financeiro_lancamentos FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), condominio_id, 'admin'));

CREATE POLICY "Admins can update lancamentos"
  ON public.financeiro_lancamentos FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), condominio_id, 'admin'));

CREATE POLICY "Admins can delete lancamentos"
  ON public.financeiro_lancamentos FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), condominio_id, 'admin'));

-- ========== Trigger: auto-create profile on signup ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
