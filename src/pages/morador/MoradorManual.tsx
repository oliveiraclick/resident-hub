import MoradorLayout from "@/components/MoradorLayout";
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
  Repeat,
  User,
  Package,
  QrCode,
  CalendarCheck,
  UserPlus,
  PartyPopper,
  Store,
  ClipboardList,
  Star,
  Bell,
  Image,
  BookOpen,
} from "lucide-react";

const sections = [
  {
    icon: Home,
    title: "Tela Inicial (Home)",
    content: `A tela inicial é o ponto de partida do app. Nela você encontra:

• **Banners** – Informativos e promoções do seu condomínio. Toque para ver detalhes ou entrar em contato via WhatsApp.
• **Avisos** – Comunicados importantes da administração do condomínio, exibidos em destaque.
• **Grade de Serviços** – Atalhos rápidos para as principais funcionalidades como Encomendas, Reservas, Convites, QR ID e mais.
• **Prestadores Ativos** – Lista dos prestadores de serviço disponíveis no seu condomínio.
• **Vitrine** – Produtos em destaque dos prestadores.`,
  },
  {
    icon: Wrench,
    title: "Serviços",
    content: `Aqui você encontra todos os **prestadores de serviço** vinculados ao seu condomínio.

**Como usar:**
1. Toque em "Serviços" no menu inferior.
2. Navegue pelas categorias (Eletricista, Encanador, Faxina, Pintura, etc.).
3. Toque no prestador desejado para ver detalhes, avaliações e entrar em contato via WhatsApp.

💡 Você também pode acessar "Ver todas as categorias" para explorar todas as especialidades disponíveis.`,
  },
  {
    icon: ShoppingBag,
    title: "E-Shop (Produtos)",
    content: `O E-Shop é a loja virtual do condomínio, onde prestadores vendem seus produtos.

**Como usar:**
1. Toque em "Shop" no menu inferior.
2. Navegue pelos produtos disponíveis.
3. Toque em um produto para ver fotos, descrição, preço e entrar em contato com o vendedor.

💡 Você também pode acessar lojas individuais para ver o cardápio completo de cada prestador.`,
  },
  {
    icon: Repeat,
    title: "Desapego",
    content: `O Desapego é o espaço para vender ou doar itens que você não usa mais para outros moradores.

**Como anunciar:**
1. Toque em "Desapego" no menu inferior.
2. Toque no botão "+" para criar um novo anúncio.
3. Adicione foto, título, descrição e preço (ou marque como doação).
4. Publique e aguarde o contato de interessados via WhatsApp.

**Como comprar:**
1. Navegue pelos anúncios disponíveis.
2. Toque no item para ver detalhes.
3. Use o botão de WhatsApp para falar diretamente com o anunciante.`,
  },
  {
    icon: Package,
    title: "Encomendas",
    content: `Acompanhe suas encomendas recebidas na portaria do condomínio.

**Como funciona:**
1. Acesse "Encomendas" pela grade de serviços na Home.
2. Veja a lista de pacotes pendentes de retirada.
3. Quando retirar, o porteiro registra a entrega com leitura de QR Code.

📦 Você receberá uma notificação quando uma nova encomenda chegar.`,
  },
  {
    icon: QrCode,
    title: "QR ID",
    content: `Seu QR Code de identificação pessoal dentro do condomínio.

**Como usar:**
1. Acesse "QR ID" pela grade de serviços na Home.
2. Apresente o QR Code quando solicitado na portaria.
3. O porteiro pode escanear para confirmar sua identidade rapidamente.

🔒 O QR Code é único e vinculado à sua conta. Não compartilhe com terceiros.`,
  },
  {
    icon: CalendarCheck,
    title: "Reservas",
    content: `Reserve espaços comuns do condomínio como salão de festas, churrasqueira, quadra, etc.

**Como reservar:**
1. Acesse "Reservas" pela grade de serviços na Home.
2. Escolha o espaço desejado.
3. Selecione a data e o horário disponíveis.
4. Confirme a reserva.

⚠️ Reservas estão sujeitas à aprovação da administração do condomínio.`,
  },
  {
    icon: UserPlus,
    title: "Convites de Visitantes",
    content: `Crie convites digitais para seus visitantes, com QR Code de acesso.

**Como criar um convite:**
1. Acesse "Convites" pela grade de serviços na Home.
2. Toque em "Novo Convite".
3. Preencha: nome do visitante, data da visita e horários de entrada/saída.
4. Compartilhe o link gerado com seu visitante via WhatsApp ou outro app.

**O que o visitante faz:**
- Acessa o link recebido.
- Registra sua foto para identificação.
- Apresenta o QR Code na portaria.

🎫 Convites ativos aparecem como badge na sua tela inicial.`,
  },
  {
    icon: PartyPopper,
    title: "Entre Amigos (Eventos)",
    content: `Organize eventos sociais com outros moradores do condomínio.

**Como criar um evento:**
1. Acesse "Entre Amigos" pela grade de serviços na Home.
2. Toque em "Novo Evento".
3. Preencha título, descrição e adicione uma imagem.
4. Convide moradores para participar.

**Funcionalidades do evento:**
• **Lista de Itens** – Organize quem leva o quê.
• **Despesas** – Registre gastos e divida entre os participantes.
• **Cotações** – Solicite orçamentos de prestadores para o evento (buffet, decoração, etc.).
• **Pagamentos** – Gerencie quem pagou e quem deve.

🎉 Participantes recebem notificação de convite com badge na Home.`,
  },
  {
    icon: Store,
    title: "Lojas e Cardápios",
    content: `Acesse as lojas dos prestadores e veja cardápios completos.

**Como usar:**
1. Acesse "Lojas" pela Home ou pelo E-Shop.
2. Escolha uma loja para ver o cardápio.
3. Navegue por categorias de produtos.
4. Monte seu pedido e envie diretamente para o prestador.

🕐 Verifique o horário de funcionamento de cada loja antes de fazer o pedido.`,
  },
  {
    icon: ClipboardList,
    title: "Meus Pedidos",
    content: `Acompanhe o status de todos os seus pedidos feitos nas lojas do condomínio.

**Status dos pedidos:**
• **Pendente** – Pedido enviado, aguardando confirmação do prestador.
• **Confirmado** – Prestador aceitou o pedido.
• **Pronto** – Pedido pronto para retirada/entrega.
• **Entregue** – Pedido finalizado.
• **Cancelado** – Pedido cancelado.`,
  },
  {
    icon: Star,
    title: "Avaliações",
    content: `Avalie os prestadores de serviço do seu condomínio.

**Como avaliar:**
1. Acesse "Avaliações" pelo menu ou pelo perfil do prestador.
2. Dê uma nota de 1 a 5 estrelas.
3. Escreva um comentário (opcional) sobre a experiência.

⭐ Suas avaliações ajudam outros moradores a escolherem os melhores prestadores.`,
  },
  {
    icon: User,
    title: "Meu Perfil",
    content: `Gerencie suas informações pessoais.

**O que você pode editar:**
• **Nome** – Seu nome de exibição.
• **Foto** – Sua foto de perfil.
• **Telefone** – Número para contato (usado no Desapego e outros).
• **Endereço** – Rua e número da casa/apartamento.

🔐 Para sair da conta, use o botão "Sair" no final da página de perfil.`,
  },
];

const MoradorManual = () => {
  return (
    <MoradorLayout title="Manual do Morador" showBack>
      <div className="p-4 pb-24 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Manual do Morador</h1>
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
            Dúvidas? Entre em contato com a administração do seu condomínio.
          </p>
        </div>
      </div>
    </MoradorLayout>
  );
};

export default MoradorManual;
