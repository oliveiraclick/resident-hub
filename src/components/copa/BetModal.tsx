import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trophy, Send, QrCode, Copy, CheckCircle2, Layers, Zap, ChevronRight } from "lucide-react";

interface BetModalProps {
  isOpen: boolean;
  onClose: () => void;
  jogo: any;
  betType: string;
  onSuccess: () => void;
}

export const BetModal = ({ isOpen, onClose, jogo, betType, onSuccess, forceShowMultiplas }: BetModalProps & { forceShowMultiplas?: boolean }) => {
  const { user } = useAuth();
  const [hScore, setHScore] = useState<string>("");
  const [aScore, setAScore] = useState<string>("");
  const [vencedor, setVencedor] = useState<string | null>(null);
  const [artilheiro, setArtilheiro] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPix, setShowPix] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [betOption, setBetOption] = useState<'unica' | 'multiplas' | null>(null);
  const [pixConfig, setPixConfig] = useState<{ key: string, name: string, value: number } | null>(null);

  const imgRef60 = useRef<HTMLImageElement>(null);
  const imgRef100 = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const fetchPixConfig = async () => {
      setPixConfig({
        key: "00020126690014BR.GOV.BCB.PIX0121oswaldinofj@gmail.com0222Bola da Copa O Morador520400005303986540520.005802BR5925Oswaldino Ferreira Guimar6009SAO PAULO61080540900062240520TFXo0xaIlTmUa0H2sgb8630495CA",
        name: "Oswaldino Ferreira Guimarães",
        value: 20
      });
    };
    if (isOpen) {
      fetchPixConfig();
      setShowPix(false);
      setShowOptions(false);
      setHScore("");
      setAScore("");
      setVencedor(null);
      if (forceShowMultiplas) {
        setBetOption('multiplas');
        setShowPix(true);
      } else {
        setBetOption(null);
      }
    }
  }, [isOpen, betType, forceShowMultiplas]);


  if (!jogo) return null;

  const copyPix = (text?: string) => {
    const toCopy = text || pixConfig?.key;
    if (toCopy) {
      navigator.clipboard.writeText(toCopy);
      toast.success("Copiado!");
    }
  };

  const processAposta = async (valor: number, method: 'pix_direto' | 'carteira') => {
    if (!user) return;
    setLoading(true);
    try {
      const palpite_valor = (betType === 'placar' || betType === 'bolao')
        ? { h: parseInt(hScore), a: parseInt(aScore), vencedor: vencedor }
        : { campeao: jogo.time_home };

      const { data: condoIds } = await supabase.rpc("get_user_condominio_ids", { _user_id: user.id });
      const condominio_id = Array.isArray(condoIds) && condoIds.length > 0 ? condoIds[0] : null;

      const { error } = await supabase
        .from("copa_palpites")
        .insert({
          user_id: user.id,
          condominio_id: condominio_id,
          jogo_id: (jogo.id === 'recharge' || !jogo.id || jogo.id === '00000000-0000-0000-0000-000000000000') 
            ? '00000000-0000-0000-0000-000000000000' 
            : jogo.id,
          tipo: jogo.id === 'recharge' ? 'recharge' : betType,
          palpite_valor: palpite_valor,
          status_pagamento: "pendente",
          valor_pago: valor,
          pago: false,
          metodo_pagamento: method
        });

      if (error) throw error;

      toast.success(method === 'carteira' ? "Pré-aposta registrada! O saldo será liberado após o OK do ADM." : "Palpite registrado! Realize o pagamento para validar.");
      onSuccess();
      setShowOptions(false);
      setShowPix(true);
    } catch (error: any) {
      toast.error("Erro ao enviar palpite: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (option: 'unica' | 'multiplas') => {
    setBetOption(option);
    setShowOptions(false);
    if (option === 'unica') {
      processAposta(20, 'pix_direto');
    } else {
      setShowPix(true);
    }
  };

  const handleMultiPixSelect = (valor: number) => {
    processAposta(valor, 'carteira');
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para apostar.");
      return;
    }

    if ((betType === 'placar' || betType === 'bolao') && (hScore === "" || aScore === "")) {
      toast.error("Preencha o placar do jogo.");
      return;
    }

    if (betType === 'bolao' && !vencedor) {
      toast.error("Escolha quem vence ou se dará empate.");
      return;
    }

    if (betType === 'campeao' && !jogo.time_home) {
      toast.error("Seleção não identificada.");
      return;
    }

    // Check balance (real + pending recharge)
    const { data: profile } = await supabase
      .from("profiles")
      .select("saldo")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: pendencias } = await supabase
      .from("copa_palpites")
      .select("valor_pago")
      .eq("user_id", user.id)
      .eq("tipo", "recharge")
      .eq("status_pagamento", "pendente");
    
    const saldoReal = Number(profile?.saldo || 0);
    const saldoPendente = (pendencias || []).reduce((acc, curr) => acc + Number(curr.valor_pago), 0);
    const saldoTotal = saldoReal + saldoPendente;

    if (saldoTotal >= 20) {
      // If user has enough total balance, they can use 'carteira'
      processAposta(20, 'carteira');
    } else {
      // Otherwise, they must choose how to pay/recharge
      setShowOptions(true);
    }
  };

  const handleClose = () => {
    setShowPix(false);
    setShowOptions(false);
    onClose();
  };

  const isSeasonal = betType === 'bolao' || betType === 'campeao';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] w-[95vw] rounded-[32px] overflow-hidden bg-[#0a140f] text-foreground border-none p-0 max-h-[90vh] flex flex-col shadow-2xl overflow-y-auto no-scrollbar">
        {!showPix && !showOptions && (
          <div className="p-6 overflow-y-auto no-scrollbar">
            <DialogHeader className="mb-6">
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="text-warning" size={20} />
                Apostar no {betType === 'placar' ? 'Placar' : betType === 'campeao' ? 'Campeão' : 'Bolão'}
              </DialogTitle>
              <DialogDescription className="text-xs uppercase font-bold tracking-tighter">
                {jogo.id === '00000000-0000-0000-0000-000000000000' ? 'PALPITE TEMPORADA 2026' : `${jogo.time_home} x ${jogo.time_away}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {(betType === 'placar' || betType === 'bolao') ? (
                <div className="space-y-6">
                  {betType === 'bolao' && (
                    <div className="flex flex-col gap-2 p-3 bg-primary/5 rounded-2xl border border-primary/10">
                      <p className="text-[10px] font-black uppercase text-primary italic">Regras de Pontuação Bolão:</p>
                      <ul className="text-[10px] font-bold text-muted-foreground uppercase space-y-1">
                        <li>• Placar Exato: 5 Pontos</li>
                        <li>• Acertar Vencedor ou Empate: 3 Pontos</li>
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center flex-1 space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground truncate block">
                        {jogo.time_home}
                      </Label>
                      <Input 
                        type="number" 
                        value={hScore}
                        onChange={(e) => {
                          const val = e.target.value;
                          setHScore(val);
                          // Auto-select winner if both scores are present
                          if (val !== "" && aScore !== "") {
                            const h = parseInt(val);
                            const a = parseInt(aScore);
                            if (h > a) setVencedor('home');
                            else if (a > h) setVencedor('away');
                            else setVencedor('draw');
                          }
                        }}
                        className="h-16 text-2xl font-black text-center rounded-2xl bg-muted border-none"
                        placeholder="0"
                      />
                    </div>
                    <span className="text-xl font-black italic text-muted-foreground pt-6">X</span>
                    <div className="text-center flex-1 space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground truncate block">
                        {jogo.time_away}
                      </Label>
                      <Input 
                        type="number" 
                        value={aScore}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAScore(val);
                          // Auto-select winner if both scores are present
                          if (hScore !== "" && val !== "") {
                            const h = parseInt(hScore);
                            const a = parseInt(val);
                            if (h > a) setVencedor('home');
                            else if (a > h) setVencedor('away');
                            else setVencedor('draw');
                          }
                        }}
                        className="h-16 text-2xl font-black text-center rounded-2xl bg-muted border-none"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {betType === 'bolao' && (
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground block text-center">
                        Quem vence o jogo?
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          variant={vencedor === 'home' ? 'default' : 'outline'}
                          className={`text-[10px] font-black uppercase h-10 rounded-xl transition-all ${vencedor === 'home' ? 'bg-primary scale-105 shadow-lg' : 'bg-transparent border-white/10 opacity-50 hover:opacity-100'}`}
                          onClick={() => setVencedor('home')}
                        >
                          {jogo.time_home}
                        </Button>
                        <Button
                          variant={vencedor === 'draw' ? 'default' : 'outline'}
                          className={`text-[10px] font-black uppercase h-10 rounded-xl transition-all ${vencedor === 'draw' ? 'bg-primary scale-105 shadow-lg' : 'bg-transparent border-white/10 opacity-50 hover:opacity-100'}`}
                          onClick={() => setVencedor('draw')}
                        >
                          Empate
                        </Button>
                        <Button
                          variant={vencedor === 'away' ? 'default' : 'outline'}
                          className={`text-[10px] font-black uppercase h-10 rounded-xl transition-all ${vencedor === 'away' ? 'bg-primary scale-105 shadow-lg' : 'bg-transparent border-white/10 opacity-50 hover:opacity-100'}`}
                          onClick={() => setVencedor('away')}
                        >
                          {jogo.time_away}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : betType === 'bolao_legacy' ? (
                <div className="space-y-4">
                  {/* ... legacy content ... */}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-primary/10 p-5 rounded-3xl border border-primary/20 flex flex-col items-center text-center gap-3">
                    <div className="w-16 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                       <span className="text-xl font-black">{jogo.time_home.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Sua Escolha</p>
                      <h3 className="text-xl font-black uppercase text-primary italic">{jogo.time_home}</h3>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium bg-muted/30 p-4 rounded-2xl text-center">
                    Você está apostando que a seleção da <strong>{jogo.time_home}</strong> será a grande campeã da Copa 2026.
                  </p>
                </div>
              )}

              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-muted-foreground uppercase">Valor da Aposta</span>
                  <span className="text-primary font-black">R$ 20.00</span>
                </div>
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest"
              >
                {loading ? "Processando..." : "Confirmar Aposta"}
                <Send className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {showOptions && (
          <div className="p-8 text-center space-y-6 overflow-y-auto no-scrollbar">
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight">Tipo de Aposta</h2>
              <p className="text-xs text-muted-foreground font-medium">Como você deseja participar?</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => handleSelectOption('unica')}
                className="flex items-center gap-4 p-5 rounded-[24px] bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left group"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Zap size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-black uppercase tracking-tight">Aposta Única</p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Pague apenas este jogo (R$ 20)</p>
                </div>
              </button>

              <button
                onClick={() => handleSelectOption('multiplas')}
                className="flex items-center gap-4 p-5 rounded-[24px] bg-primary/5 border-2 border-primary/20 hover:bg-primary/10 transition-all text-left group"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <Layers size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-black uppercase tracking-tight text-primary">Múltiplas Apostas</p>
                  <p className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">Comprar créditos para a conta</p>
                </div>
              </button>
            </div>

            <Button variant="ghost" onClick={() => setShowOptions(false)} className="text-[10px] font-black uppercase tracking-widest opacity-40">
              Voltar e editar palpite
            </Button>
          </div>
        )}

        {showPix && (
          <div className="p-6 text-center space-y-6 flex-1">
            <div className="flex flex-col items-center gap-2">
              <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 size={32} className="text-success" />
              </div>
              <h2 className="text-xl font-black uppercase italic">Palpite Registrado!</h2>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                {betOption === 'multiplas' ? 'Escolha o valor do crédito para pagar' : 'Pague agora para validar sua participação'}
              </p>
            </div>

            {betOption === 'unica' ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center p-6 bg-white rounded-[32px] border-4 border-muted/50 shadow-2xl overflow-hidden min-h-[220px]">
                  <img 
                    src="/pix-qrcode.jpeg" 
                    alt="PIX QR Code" 
                    className="w-[200px] h-[200px] object-contain block mx-auto bg-white p-2 rounded-xl"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(pixConfig?.key || '');
                    }}
                  />
                </div>
                
                <div className="bg-muted/30 p-4 rounded-2xl space-y-2">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Copia e Cola (R$ 20)</p>
                  <div className="flex items-center gap-2 bg-background p-3 rounded-xl border border-border">
                    <p className="text-[10px] font-bold truncate flex-1">{pixConfig?.key}</p>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyPix()}>
                      <Copy size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {/* Pacote 60 */}
                <div className="bg-white/5 rounded-[32px] border border-white/10 p-4 space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[11px] font-black uppercase text-primary tracking-widest">Pacote Bronze</span>
                    <span className="text-xl font-black italic">R$ 60</span>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-4">
                    <div className="relative">
                      <img 
                        ref={imgRef60} 
                        src="/pix-60.png" 
                        alt="PIX 60" 
                        className="w-44 h-44 block bg-white object-contain" 
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent("00020126810014BR.GOV.BCB.PIX0121oswaldinofj@gmail.com0234Bolão Copa do Mundo O Moraror R$60520400005303986540560.005802BR5925Oswaldino Ferreira Guimar6009SAO PAULO621405102R7kwQAjSC6304588E");
                        }}
                      />
                    </div>

                    <div className="w-full space-y-2">
                      <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest text-center">Copia e Cola (R$ 60)</p>
                      <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200">
                        <p className="text-[10px] font-bold truncate flex-1 text-slate-900">00020126810014BR.GOV.BCB.PIX0121oswaldinofj@gmail.com0234Bolão Copa do Mundo O Moraror R$60520400005303986540560.005802BR5925Oswaldino Ferreira Guimar6009SAO PAULO621405102R7kwQAjSC6304588E</p>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 hover:bg-primary/10 transition-colors shrink-0" 
                          onClick={() => copyPix("00020126810014BR.GOV.BCB.PIX0121oswaldinofj@gmail.com0234Bolão Copa do Mundo O Moraror R$60520400005303986540560.005802BR5925Oswaldino Ferreira Guimar6009SAO PAULO621405102R7kwQAjSC6304588E")}
                        >
                          <Copy size={16} className="text-primary" />
                        </Button>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleMultiPixSelect(60)}
                      className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest transition-all active:scale-[0.98]"
                    >
                      Já paguei R$ 60 <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Pacote 100 */}
                <div className="bg-primary/5 rounded-[32px] border-2 border-primary/20 p-4 space-y-4 relative overflow-hidden shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                  <div className="absolute top-0 right-0 p-2">
                    <Zap size={14} className="text-primary animate-pulse" />
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[11px] font-black uppercase text-primary tracking-widest">Pacote Ouro</span>
                    <span className="text-xl font-black italic">R$ 100</span>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-4">
                    <div className="relative">
                      <img 
                        ref={imgRef100} 
                        src="/pix-100.png" 
                        alt="PIX 100" 
                        className="w-44 h-44 block bg-white object-contain" 
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent("00020126820014BR.GOV.BCB.PIX0121oswaldinofj@gmail.com0235Bolão Copa do Mundo O Morador R$1005204000053039865406100.005802BR5925Oswaldino Ferreira Guimar6009SAO PAULO62140510OiJEMerkG0630404B8");
                        }}
                      />
                    </div>

                    <div className="w-full space-y-2">
                      <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest text-center">Copia e Cola (R$ 100)</p>
                      <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200">
                        <p className="text-[10px] font-bold truncate flex-1 text-slate-900">00020126820014BR.GOV.BCB.PIX0121oswaldinofj@gmail.com0235Bolão Copa do Mundo O Morador R$1005204000053039865406100.005802BR5925Oswaldino Ferreira Guimar6009SAO PAULO62140510OiJEMerkG0630404B8</p>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 hover:bg-primary/10 transition-colors shrink-0" 
                          onClick={() => copyPix("00020126820014BR.GOV.BCB.PIX0121oswaldinofj@gmail.com0235Bolão Copa do Mundo O Morador R$1005204000053039865406100.005802BR5925Oswaldino Ferreira Guimar6009SAO PAULO62140510OiJEMerkG0630404B8")}
                        >
                          <Copy size={16} className="text-primary" />
                        </Button>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleMultiPixSelect(100)}
                      className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-[11px] uppercase tracking-widest transition-all active:scale-[0.98]"
                    >
                      Já paguei R$ 100 <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-warning/10 p-4 rounded-2xl border border-warning/20">
              <p className="text-[9px] font-bold text-warning uppercase leading-tight tracking-widest italic">
                Sua participação será validada pelo administrador em até 24h após o pagamento.
              </p>
            </div>

            <Button 
              onClick={handleClose}
              className="w-full h-12 rounded-2xl bg-muted text-foreground font-black uppercase tracking-widest text-[11px]"
            >
              FECHAR E VER MEUS PALPITES
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};