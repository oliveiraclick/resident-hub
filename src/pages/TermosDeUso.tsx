import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermosDeUso = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background mx-auto max-w-[640px] px-5 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground mb-6 text-sm">
        <ArrowLeft size={16} /> Voltar
      </button>

      <h1 className="text-xl font-bold text-foreground mb-4">Termos de Uso</h1>
      <p className="text-xs text-muted-foreground mb-6">Última atualização: fevereiro de 2026</p>

      <div className="space-y-4 text-sm text-foreground leading-relaxed">
        <section>
          <h2 className="font-semibold mb-1">1. Sobre a plataforma</h2>
          <p>O Morador.app é uma plataforma digital que facilita a comunicação e os serviços entre moradores, prestadores e a administração de condomínios.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">2. Cadastro</h2>
          <p>Para utilizar a plataforma, é necessário criar uma conta com informações verdadeiras. Cada usuário é responsável por manter seus dados atualizados e pela segurança de sua senha.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">3. Uso adequado</h2>
          <p>A plataforma deve ser utilizada de forma ética e respeitosa. É proibido publicar conteúdo ofensivo, fraudulento ou que viole leis vigentes.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">4. Serviços e produtos</h2>
          <p>A plataforma conecta moradores e prestadores, mas não se responsabiliza pela qualidade, entrega ou pagamento de serviços e produtos negociados entre os usuários.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">5. Desapego</h2>
          <p>A funcionalidade de desapego permite que moradores anunciem itens para venda ou doação dentro do condomínio. Recomendamos que todas as transações sejam feitas pessoalmente.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">6. Modificações</h2>
          <p>Reservamo-nos o direito de atualizar estes termos a qualquer momento. Alterações significativas serão comunicadas através da plataforma.</p>
        </section>
      </div>
    </div>
  );
};

export default TermosDeUso;
