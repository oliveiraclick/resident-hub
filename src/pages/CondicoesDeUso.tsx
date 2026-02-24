import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CondicoesDeUso = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background mx-auto max-w-[640px] px-5 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground mb-6 text-sm">
        <ArrowLeft size={16} /> Voltar
      </button>

      <h1 className="text-xl font-bold text-foreground mb-4">Condições de Uso</h1>
      <p className="text-xs text-muted-foreground mb-6">Última atualização: fevereiro de 2026</p>

      <div className="space-y-4 text-sm text-foreground leading-relaxed">
        <section>
          <h2 className="font-semibold mb-1">1. Natureza da plataforma</h2>
          <p>O Morador.app atua como um facilitador de comunicação entre moradores, prestadores de serviço e a administração do condomínio. A plataforma não participa diretamente de negociações, prestação de serviços ou transações financeiras entre os usuários.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">2. Responsabilidade dos usuários</h2>
          <p>Cada usuário é responsável pelas informações que publica, pelos serviços que oferece e pelas negociações que realiza através da plataforma. Recomendamos sempre verificar pessoalmente produtos e serviços antes de efetuar qualquer pagamento.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">3. Transações entre moradores</h2>
          <p>A plataforma disponibiliza ferramentas como o Desapego e a E-shop para facilitar trocas e vendas entre moradores. Todas as transações são de responsabilidade exclusiva das partes envolvidas.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">4. Prestadores de serviço</h2>
          <p>Os prestadores cadastrados na plataforma são responsáveis pela qualidade e entrega dos seus serviços. O Morador.app não garante, endossa ou se responsabiliza por serviços prestados.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">5. Limitação de responsabilidade</h2>
          <p>O Morador.app não se responsabiliza por danos diretos ou indiretos decorrentes do uso da plataforma, incluindo perdas financeiras resultantes de negociações entre usuários.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">6. Aceitação</h2>
          <p>Ao se cadastrar na plataforma, o usuário declara ter lido e estar de acordo com todas as condições descritas neste documento.</p>
        </section>
      </div>
    </div>
  );
};

export default CondicoesDeUso;
