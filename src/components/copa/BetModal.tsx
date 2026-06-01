import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trophy, Send, QrCode, Copy, CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

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
  const [pixConfig, setPixConfig] = useState<{ key: string, name: string, value: number } | null>(null);

  useEffect(() => {
    const fetchPixConfig = async () => {
      const { data } = await supabase
        .from("app_configs" as any)
        .select("pix_key, pix_name, valor_aposta")
        .eq("key", "theme_world_cup")
        .maybeSingle();
      
      if (data) {
        setPixConfig({ 
          key: (data as any).pix_key || "", 
          name: (data as any).pix_name || "",
          value: (data as any).valor_aposta || 10
        });
      }
    };
    if (isOpen) {
      fetchPixConfig();
      setShowPix(false);
    }
  }, [isOpen]);

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

    if (betType === 'artilheiro' && !artilheiro.trim()) {
      toast.error("Informe o nome do artilheiro.");
      return;
    }

    setLoading(true);
    try {
      const palpite_valor = betType === 'placar' 
        ? { h: parseInt(hScore), a: parseInt(aScore) }
        : { jogador: artilheiro };

      const { error } = await supabase
        .from("copa_palpites")
        .insert({
          user_id: user.id,
          jogo_id: jogo.id,
          tipo: betType,
          palpite_valor: palpite_valor,
          status_pagamento: "pendente",
          valor_pago: 10, // Valor padrão da aposta
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] rounded-[32px] overflow-hidden">
        {!showPix ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="text-warning" size={20} />
                Apostar no {betType === 'placar' ? 'Placar' : 'Artilheiro'}
              </DialogTitle>
              <DialogDescription className="text-xs uppercase font-bold tracking-tighter">
                {jogo.time_home} x {jogo.time_away}
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
              ) : (
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase ml-1">Quem fará o primeiro gol?</Label>
                  <Input 
                    placeholder="Nome do Jogador..."
                    value={artilheiro}
                    onChange={(e) => setArtilheiro(e.target.value)}
                    className="h-12 rounded-2xl bg-muted border-none px-4"
                  />
                </div>
              )}

              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-muted-foreground uppercase">Valor da Aposta</span>
                  <span className="text-primary">R$ 10,00</span>
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
              <QRCodeSVG 
                value={pixConfig?.key || "PIX_KEY_NOT_SET"} 
                size={180}
                level="H"
                includeMargin={false}
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
