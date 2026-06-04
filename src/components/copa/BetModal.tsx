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

export const BetModal = ({ isOpen, onClose, jogo, betType, onSuccess }: BetModalProps) => {
  const { user } = useAuth();
  const [hScore, setHScore] = useState<string>("");
  const [aScore, setAScore] = useState<string>("");
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
      setBetOption(null);
    }
  }, [isOpen, betType]);


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
      const palpite_valor = betType === 'placar' 
        ? { h: parseInt(hScore), a: parseInt(aScore) }
        : betType === 'bolao'
        ? { bolao: true }
        : { campeao: artilheiro };

      const { data: condoIds } = await supabase.rpc("get_user_condominio_ids", { _user_id: user.id });
      const condominio_id = Array.isArray(condoIds) && condoIds.length > 0 ? condoIds[0] : null;

      const { error } = await supabase
        .from("copa_palpites")
        .insert({
          user_id: user.id,
          condominio_id: condominio_id,
          jogo_id: jogo.id,
          tipo: betType,
          palpite_valor: palpite_valor,
          status_pagamento: "pendente",
          valor_pago: valor,
          pago: false,
          metodo_pagamento: method
        });

      if (error) throw error;

      toast.success(method === 'carteira' ? "Pré-aposta registrada! O saldo será liberado após o OK do ADM." : "Palpite registrado! Realize o pagamento para validar.");
      onSuccess();
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

    if (betType === 'placar' && (hScore === "" || aScore === "")) {
      toast.error("Preencha o placar do jogo.");
      return;
    }

    if (betType === 'campeao' && !artilheiro.trim()) {
      toast.error("Informe a seleção campeã.");
      return;
    }

    setShowOptions(true);
  };

  const handleClose = () => {
    setShowPix(false);
    setShowOptions(false);
    onClose();
  };

  const isSeasonal = jogo?.id === 'seasonal' || betType === 'bolao' || betType === 'campeao';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] w-[95vw] rounded-[32px] overflow-hidden bg-[#0a140f] text-foreground border-none p-0 max-h-[92vh] flex flex-col shadow-2xl">
        {!showPix && !showOptions && (
          <div className="p-6 overflow-y-auto no-scrollbar">
            <DialogHeader className="mb-6">
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="text-warning" size={20} />
                Apostar no {betType === 'placar' ? 'Placar' : betType === 'campeao' ? 'Campeão' : 'Bolão'}
              </DialogTitle>
              <DialogDescription className="text-xs uppercase font-bold tracking-tighter">
                {isSeasonal ? 'PALPITE TEMPORADA 2026' : `${jogo.time_home} x ${jogo.time_away}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {betType === 'placar' ? (
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center flex-1 space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground truncate block">
                      {jogo.time_home}
                    </Label>
                    <Input 
                      type="number" 
                      value={hScore}
                      onChange={(e) => setHScore(e.target.value)}
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
                      onChange={(e) => setAScore(e.target.value)}
                      className="h-16 text-2xl font-black text-center rounded-2xl bg-muted border-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              ) : betType === 'bolao' ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 p-3 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-[10px] font-black uppercase text-primary italic">Regras do Bolão:</p>
                    <ul className="text-[10px] font-bold text-muted-foreground uppercase space-y-1">
                      <li>• Placar Exato: 5 Pontos</li>
                      <li>• Vencedor: 3 Pontos</li>
                      <li>• Empate: 3 Pontos</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase ml-1">Confirme seu interesse no bolão geral:</Label>
                    <p className="text-[11px] text-muted-foreground font-medium bg-muted/30 p-4 rounded-2xl">
                      Você está participando do ranking geral de todos os jogos da Copa. Seus pontos serão calculados automaticamente baseados em seus palpites de placar.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase ml-1">Qual seleção será a campeã?</Label>
                  <Input 
                    placeholder="Nome do País..."
                    value={artilheiro}
                    onChange={(e) => setArtilheiro(e.target.value)}
                    className="h-12 rounded-2xl bg-muted border-none px-4"
                  />
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
          <div className="p-6 text-center space-y-6 overflow-y-auto no-scrollbar flex-1">
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
                <div className="flex flex-col items-center justify-center p-6 bg-white rounded-[32px] border-4 border-muted/50 shadow-2xl">
                  <img src="/pix-qrcode.jpeg" alt="PIX QR Code" style={{ width: '180px', height: '180px', display: 'block', margin: '0 auto', backgroundColor: 'white', padding: '4px' }} />
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
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-card p-5 rounded-[32px] border border-white/5 space-y-4 shadow-lg">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">Pacote Bronze</span>
                    <span className="text-lg font-black italic">R$ 60</span>
                  </div>
                  <div className="bg-white p-6 rounded-3xl flex flex-col items-center gap-3">
                    <img ref={imgRef60} src="/pix-60.png" alt="PIX 60" className="w-56 h-56 mx-auto block bg-white p-2 rounded-xl" onLoad={() => { if(imgRef60.current) imgRef60.current.style.opacity = '1'; }} />
                    <div className="bg-muted/50 p-4 rounded-2xl space-y-2 w-full">
                      <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest text-center">Copia e Cola (R$ 60)</p>
                      <div className="flex items-center gap-2 bg-background p-3 rounded-xl border border-border">
                        <p className="text-[10px] font-bold truncate flex-1">00020126810014BR.GOV.BCB.PIX0121oswaldinofj@gmail.com0234Bolão Copa do Mundo O Moraror R$60520400005303986540560.005802BR5925Oswaldino Ferreira Guimar6009SAO PAULO621405102R7kwQAjSC6304588E</p>
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10 transition-colors" onClick={() => copyPix("00020126810014BR.GOV.BCB.PIX0121oswaldinofj@gmail.com0234Bolão Copa do Mundo O Moraror R$60520400005303986540560.005802BR5925Oswaldino Ferreira Guimar6009SAO PAULO621405102R7kwQAjSC6304588E")}>
                          <Copy size={16} className="text-primary" />
                        </Button>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleMultiPixSelect(60)}
                      className="w-full h-10 rounded-xl bg-foreground text-background font-black text-[10px] uppercase tracking-widest"
                    >
                      Já paguei R$ 60 <ChevronRight size={14} />
                    </Button>
                  </div>
                </div>

                <div className="bg-card p-5 rounded-[32px] border-2 border-primary/20 space-y-4 relative overflow-hidden group shadow-lg">
                  <div className="absolute top-0 right-0 p-2">
                    <Zap size={16} className="text-primary animate-pulse" />
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">Pacote Ouro</span>
                    <span className="text-lg font-black italic">R$ 100</span>
                  </div>
                  <div className="bg-white p-6 rounded-3xl flex flex-col items-center gap-3">
                    <img src="/pix-100.png" alt="PIX 100" className="w-56 h-56 mx-auto block bg-white p-2 rounded-xl" />
                    <div className="bg-muted/50 p-4 rounded-2xl space-y-2 w-full text-center">
                      <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Copia e Cola (R$ 100)</p>
                      <div className="flex items-center gap-2 bg-background p-3 rounded-xl border border-border">
                        <p className="text-[10px] font-bold truncate flex-1">00020126820014BR.GOV.BCB.PIX0121oswaldinofj@gmail.com0235Bolão Copa do Mundo O Morador R$1005204000053039865406100.005802BR5925Oswaldino Ferreira Guimar6009SAO PAULO62140510OiJEMerkG0630404B8</p>
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10 transition-colors" onClick={() => copyPix("00020126820014BR.GOV.BCB.PIX0121oswaldinofj@gmail.com0235Bolão Copa do Mundo O Morador R$1005204000053039865406100.005802BR5925Oswaldino Ferreira Guimar6009SAO PAULO62140510OiJEMerkG0630404B8")}>
                          <Copy size={16} className="text-primary" />
                        </Button>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleMultiPixSelect(100)}
                      className="w-full h-10 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest"
                    >
                      Já paguei R$ 100 <ChevronRight size={14} />
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
              Já realizei o pagamento
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};