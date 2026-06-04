import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trophy, Send, QrCode, Copy, CheckCircle2 } from "lucide-react";


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
  const [betCount, setBetCount] = useState<'unica' | 'multiplas' | null>(null);
  const [pixConfig, setPixConfig] = useState<{ key: string, name: string, value: number, isMulti?: boolean } | null>(null);

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
    }
  }, [isOpen, betType]);


  if (!jogo) return null;

  const copyPix = () => {
    if (pixConfig?.key) {
      navigator.clipboard.writeText(pixConfig.key);
      toast.success("Chave PIX copiada!");
    }
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

    setLoading(true);
    try {
      const palpite_valor = betType === 'placar' 
        ? { h: parseInt(hScore), a: parseInt(aScore) }
        : betType === 'bolao'
        ? { bolao: true }
        : { campeao: artilheiro };

      // Fetch condominio_id
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
          valor_pago: 20,
        });

      if (error) throw error;

      toast.success("Palpite registrado! Realize o pagamento para validar sua participação.");
      onSuccess();
      setShowPix(true);
    } catch (error: any) {
      toast.error("Erro ao enviar palpite: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowPix(false);
    onClose();
  };

  const isSeasonal = jogo?.id === 'seasonal' || betType === 'bolao' || betType === 'campeao';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] rounded-[32px] overflow-hidden bg-background text-foreground border-none">
        {!showPix ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="text-warning" size={20} />
                Apostar no {betType === 'placar' ? 'Placar' : betType === 'campeao' ? 'Campeão' : 'Bolão'}
              </DialogTitle>
              <DialogDescription className="text-xs uppercase font-bold tracking-tighter">
                {isSeasonal ? 'PALPITE TEMPORADA 2026' : `${jogo.time_home} x ${jogo.time_away}`}
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-6">
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
              
              <p className="text-[9px] text-center text-muted-foreground uppercase font-medium px-4">
                Ao confirmar, você receberá os dados do PIX para pagamento imediato.
              </p>
            </div>
          </>
        ) : (
          <div className="py-4 space-y-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 size={32} className="text-success" />
              </div>
              <h2 className="text-xl font-black uppercase">Palpite Registrado!</h2>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-tight">
                Pague agora para validar sua participação
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-[32px] border-4 border-muted/50">
              <img 
                src="/pix-qrcode.jpeg" 
                alt="PIX QR Code" 
                className="w-[180px] h-[180px] object-contain"
              />
            </div>

            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-2xl space-y-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground">Copia e Cola (Chave PIX)</p>
                <div className="flex items-center gap-2 bg-background p-3 rounded-xl border border-border">
                  <p className="text-xs font-bold truncate flex-1">{pixConfig?.key || "Chave não configurada"}</p>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={copyPix}>
                    <Copy size={14} />
                  </Button>
                </div>
                {pixConfig?.name && (
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">
                    Favorecido: {pixConfig.name}
                  </p>
                )}
              </div>

              <div className="bg-warning/10 p-4 rounded-2xl border border-warning/20">
                <p className="text-[10px] font-bold text-warning uppercase leading-tight">
                  Sua aposta será validada pelo administrador em até 24h após o pagamento.
                </p>
              </div>

              <Button 
                onClick={handleClose}
                className="w-full h-12 rounded-2xl bg-foreground text-background font-black uppercase tracking-widest"
              >
                Já realizei o pagamento
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
