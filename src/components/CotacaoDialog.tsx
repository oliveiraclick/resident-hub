import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarDays, Clock, Users, Send, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CotacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventoId: string;
  condominioId: string;
  userId: string;
  categoria: string;
  onSuccess: () => void;
}

const CotacaoDialog = ({
  open, onOpenChange, eventoId, condominioId, userId, categoria, onSuccess,
}: CotacaoDialogProps) => {
  const [dataEvento, setDataEvento] = useState<Date | undefined>();
  const [horarioInicio, setHorarioInicio] = useState("12:00");
  const [horarioFim, setHorarioFim] = useState("18:00");
  const [qtdPessoas, setQtdPessoas] = useState("10");
  const [tipoServico, setTipoServico] = useState("completo");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSend = async () => {
    if (!dataEvento) {
      toast.error("Selecione a data do evento");
      return;
    }
    const qtd = parseInt(qtdPessoas);
    if (isNaN(qtd) || qtd < 1) {
      toast.error("Informe a quantidade de pessoas");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("evento_cotacoes").insert({
      evento_id: eventoId,
      condominio_id: condominioId,
      criador_id: userId,
      categoria,
      data_evento: format(dataEvento, "yyyy-MM-dd"),
      horario_inicio: horarioInicio,
      horario_fim: horarioFim,
      qtd_pessoas: qtd,
      tipo_servico: tipoServico,
      observacoes: observacoes.trim() || null,
    } as any);

    if (error) {
      toast.error("Erro ao enviar cotação");
      console.error(error);
    } else {
      toast.success("Cotação enviada para os prestadores! 🎉");
      onSuccess();
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" /> Solicitar Cotação
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info banner */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground">
            📢 Todos os <strong className="text-foreground">{categoria}s</strong> do condomínio receberão sua solicitação e poderão enviar propostas.
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <CalendarDays size={12} /> Data do evento
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataEvento && "text-muted-foreground")}>
                  <CalendarDays size={14} className="mr-2" />
                  {dataEvento ? format(dataEvento, "dd 'de' MMMM, yyyy", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataEvento}
                  onSelect={setDataEvento}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Clock size={12} /> Início
              </label>
              <Input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Clock size={12} /> Término
              </label>
              <Input type="time" value={horarioFim} onChange={(e) => setHorarioFim(e.target.value)} />
            </div>
          </div>

          {/* People */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <Users size={12} /> Quantidade de pessoas
            </label>
            <Input
              type="number"
              min={1}
              placeholder="Ex: 20"
              value={qtdPessoas}
              onChange={(e) => setQtdPessoas(e.target.value)}
              inputMode="numeric"
            />
          </div>

          {/* Service type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">🍽️ Tipo de serviço</label>
            <Select value={tipoServico} onValueChange={setTipoServico}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="simples">Só o básico</SelectItem>
                <SelectItem value="completo">Serviço completo</SelectItem>
                <SelectItem value="premium">Premium / VIP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observations */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">💬 Observações</label>
            <Textarea
              placeholder="Detalhes extras (ex: só churrasco sem acompanhamento, precisa trazer utensílios...)"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSend} disabled={saving} className="gap-2">
            <Send size={14} />
            {saving ? "Enviando..." : "Disparar cotação 📢"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CotacaoDialog;
