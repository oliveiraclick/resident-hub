import PrestadorLayout from "@/components/PrestadorLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Home,
  Wrench,
  ShoppingBag,
  DollarSign,
  Star,
  User,
  Building2,
  Gift,
  Image,
  Store,
  ClipboardList,
  BookOpen,
  UtensilsCrossed,
} from "lucide-react";

const sections = [
  {
    icon: Home,
    title: "Tela Inicial (Home)",
    content: `A tela inicial é o painel de controle do prestador. Nela você encontra:

• **Visibilidade** – Ative ou desative sua visibilidade para os moradores do condomínio usando o switch no topo.
• **Banners** – Informativos e promoções do condomínio exibidos em destaque.
• **Estatísticas** – Resumo rápido com quantidade de serviços, produtos, avaliações e média de notas.
• **Ações rápidas** – Atalhos para as principais funcionalidades como Produtos, Serviços, Financeiro, etc.`,
  },
  {
    icon: Wrench,
    title: "Meus Serviços",
    content: `Gerencie os serviços que você oferece aos moradores.

**Como cadastrar um serviço:**
1. Acesse "Serviços" pelo menu ou pela Home.
2. Toque em "Novo Serviço".
3. Preencha: título, descrição, foto e preço (ou marque "Sob consulta").
4. Publique o serviço.

💡 Serviços com foto, descrição e preço completos têm mais destaque na vitrine.`,
  },
  {
    icon: ShoppingBag,
    title: "Meus Produtos",
    content: `Cadastre e gerencie seus produtos para venda no E-Shop do condomínio.

**Como cadastrar um produto:**
1. Acesse "Produtos" pelo menu ou pela Home.
2. Toque em "Novo Produto".
3. Preencha: título, descrição, foto e preço.
4. Publique o produto.

🛍️ Produtos aparecem na vitrine do condomínio e na sua loja virtual.`,
  },
  {
    icon: Store,
    title: "Minha Loja",
    content: `Sua loja virtual dentro do condomínio. Os moradores podem ver seus produtos e fazer pedidos.

**Como configurar:**
1. Acesse "Loja" pelo menu.
2. Configure nome, descrição e banner da loja.
3. Defina horários de funcionamento.
4. Ative o cardápio para receber pedidos.

🏪 Moradores podem acessar sua loja diretamente pela Home ou pelo E-Shop.`,
  },
  {
    icon: UtensilsCrossed,
    title: "Cardápio",
    content: `Organize seus produtos em categorias para facilitar os pedidos dos moradores.

**Como gerenciar o cardápio:**
1. Acesse "Cardápio" pelo menu.
2. Crie categorias (ex: Doces, Salgados, Bebidas).
3. Adicione itens com nome, descrição, foto e preço.
4. Organize a ordem das categorias e itens.

📋 O cardápio aparece na sua loja virtual e facilita o pedido dos moradores.`,
  },
  {
    icon: ClipboardList,
    title: "Pedidos",
    content: `Acompanhe e gerencie os pedidos recebidos dos moradores.

**Status dos pedidos:**
• **Pendente** – Novo pedido, aguardando sua confirmação.
• **Confirmado** – Você aceitou o pedido.
• **Pronto** – Pedido pronto para entrega/retirada.
• **Entregue** – Pedido finalizado.
• **Cancelado** – Pedido cancelado.

📦 Você receberá notificação quando um novo pedido chegar.`,
  },
  {
    icon: DollarSign,
    title: "Financeiro",
    content: `Acompanhe suas finanças e pagamentos.

**O que você encontra:**
• **Lançamentos** – Histórico de receitas e despesas.
• **Status** – Controle de pagamentos pendentes e recebidos.
• **Assinatura** – Informações sobre seu plano e período de teste.

💰 Mantenha seus pagamentos em dia para continuar visível no condomínio.`,
  },
  {
    icon: Star,
    title: "Avaliações",
    content: `Veja o que os moradores estão dizendo sobre seus serviços.

**Informações disponíveis:**
• **Média de notas** – Sua avaliação geral (1 a 5 estrelas).
• **Comentários** – Feedbacks detalhados dos moradores.

⭐ Boas avaliações aumentam sua visibilidade e confiança junto aos moradores.`,
  },
  {
    icon: Building2,
    title: "Condôminos",
    content: `Veja os condomínios nos quais você está cadastrado como prestador.

**Informações disponíveis:**
• Lista de condomínios vinculados.
• Status de aprovação em cada condomínio.

🏢 Para atuar em novos condomínios, entre em contato com a administração.`,
  },
  {
    icon: Gift,
    title: "Indicações",
    content: `Indique outros prestadores e ganhe benefícios.

**Como funciona:**
1. Acesse "Indicações" pelo menu.
2. Compartilhe seu código de indicação.
3. Quando o indicado se cadastrar e for aprovado, ambos recebem benefícios.

🎁 Cada indicação aprovada pode gerar descontos na sua assinatura.`,
  },
  {
    icon: Image,
    title: "Banners Promocionais",
    content: `Solicite banners promocionais para divulgar seus serviços no condomínio.

**Como solicitar:**
1. Acesse "Banners" pelo menu.
2. Toque em "Solicitar Banner".
3. Escolha o período de exibição e envie sua arte (ou solicite criação).
4. Aguarde a aprovação da administração.

📢 Banners aparecem em destaque na Home dos moradores.`,
  },
  {
    icon: User,
    title: "Meu Perfil",
    content: `Gerencie suas informações pessoais e profissionais.

**O que você pode editar:**
• **Nome** – Seu nome de exibição.
• **Foto** – Sua foto de perfil profissional.
• **Telefone** – Número para contato via WhatsApp.
• **Descrição** – Apresentação dos seus serviços.

🔐 Para sair da conta, use o botão "Sair" no final da página de perfil.`,
  },
];

const PrestadorManual = () => {
  return (
    <PrestadorLayout title="Manual do Prestador" showBack>
      <div className="p-4 pb-24 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Manual do Prestador</h1>
            <p className="text-xs text-muted-foreground">Aprenda a usar todas as funcionalidades</p>
          </div>
        </div>

        <Accordion type="single" collapsible className="mt-4">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger className="hover:no-underline gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-left">{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pl-11 text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                    {section.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return (
                          <strong key={i} className="text-foreground font-medium">
                            {part.slice(2, -2)}
                          </strong>
                        );
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground text-center">
            Dúvidas? Entre em contato com o suporte do app.
          </p>
        </div>
      </div>
    </PrestadorLayout>
  );
};

export default PrestadorManual;
