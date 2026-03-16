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
      <p className="text-xs text-muted-foreground mb-6">Última atualização: março de 2026</p>

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
          <h2 className="font-semibold mb-1">3. Compartilhamento com provedores de infraestrutura</h2>
          <p>Não vendemos seus dados pessoais. Informações como nome e telefone podem ser visíveis para outros moradores do mesmo condomínio apenas nos contextos necessários (ex: anúncios de desapego).</p>
          <p className="mt-2">Para a execução dos serviços da plataforma, seus dados podem ser compartilhados com os seguintes provedores de infraestrutura tecnológica, que atuam como <strong>operadores de dados</strong> nos termos da LGPD (Art. 5º, VII):</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li><strong>Supabase Inc.</strong> — banco de dados e autenticação. Servidores nos EUA, com criptografia em trânsito (TLS) e em repouso (AES-256). Compatível com SOC 2 Type II.</li>
            <li><strong>Apple (APNs) e Google (FCM)</strong> — envio de notificações push. Recebem apenas tokens de dispositivo, sem dados pessoais identificáveis.</li>
            <li><strong>Kiwify</strong> — processamento de pagamentos de assinaturas de prestadores, quando aplicável.</li>
            <li><strong>Lovable / Netlify</strong> — hospedagem do frontend da aplicação. Não armazena dados pessoais persistentes.</li>
          </ul>
          <p className="mt-2">O compartilhamento é estritamente necessário para a prestação do serviço, conforme Art. 7º, V da LGPD.</p>
        </section>

        <section>
          <h2 className="font-semibold mb-1">4. Armazenamento</h2>
          <p>Os dados são armazenados de forma segura em servidores protegidos com criptografia em trânsito (TLS) e em repouso (AES-256). Mantemos seus dados enquanto sua conta estiver ativa.</p>
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
