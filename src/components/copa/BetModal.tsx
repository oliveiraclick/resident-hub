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

  if (!jogo) return null;

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

      toast.success("Palpite enviado com sucesso! Aguarde a confirmação do pagamento.");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Erro ao enviar palpite: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-[32px]">
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
            Ao confirmar, sua aposta ficará pendente até o pagamento ser validado no painel master.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
