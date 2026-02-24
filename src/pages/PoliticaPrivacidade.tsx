import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PoliticaPrivacidade = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background mx-auto max-w-[640px] px-5 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground mb-6 text-sm">
        <ArrowLeft size={16} /> Voltar
      </button>

      <h1 className="text-xl font-bold text-foreground mb-4">Política de Privacidade</h1>
      <p className="text-xs text-muted-foreground mb-6">Última atualização: fevereiro de 2026</p>

      <div className="space-y-4 text-sm text-foreground leading-relaxed">
        <section>
          <h2 className="font-semibold mb-1">1. Dados coletados</h2>
          <p>Coletamos apenas os dados necessários para o funcionamento da plataforma: nome, e-mail, telefone e informações de unidade/condomínio. Não coletamos dados sensíveis como CPF, RG ou dados bancários.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">2. Finalidade</h2>
          <p>Seus dados são usados exclusivamente para identificação dentro do condomínio, comunicação entre moradores e prestadores, e funcionamento dos recursos da plataforma (encomendas, reservas, desapegos, etc.).</p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">3. Compartilhamento</h2>
          <p>Não vendemos ou compartilhamos seus dados com terceiros. Informações como nome e telefone podem ser visíveis para outros moradores do mesmo condomínio apenas nos contextos necessários (ex: anúncios de desapego).</p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">4. Armazenamento</h2>
          <p>Os dados são armazenados de forma segura em servidores protegidos com criptografia. Mantemos seus dados enquanto sua conta estiver ativa.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">5. Seus direitos</h2>
          <p>Você pode solicitar a exclusão dos seus dados a qualquer momento entrando em contato com a administração do seu condomínio ou com o suporte da plataforma.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">6. LGPD</h2>
          <p>Esta plataforma está em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Ao se cadastrar, você consente com o tratamento dos dados conforme descrito nesta política.</p>
        </section>
      </div>
    </div>
  );
};

export default PoliticaPrivacidade;
