import { useState, useEffect } from "react";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Send, Loader2 } from "lucide-react";

const MasterPush = () => {
  const [condominios, setCondominios] = useState<{ id: string; nome: string }[]>([]);
  const [selectedCondominio, setSelectedCondominio] = useState("todos");
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCondominios = async () => {
      const { data } = await supabase
        .from("condominios")
        .select("id, nome")
        .order("nome");
      setCondominios(data || []);
      setLoading(false);
    };
    fetchCondominios();
  }, []);

  const handleSend = async () => {
    if (!titulo.trim() || !mensagem.trim()) {
      toast.error("Preencha o título e a mensagem.");
      return;
    }

    setSending(true);
    try {
      // Get user_ids based on condomínio selection
      let query = supabase.from("user_roles").select("user_id");
      if (selectedCondominio !== "todos") {
        query = query.eq("condominio_id", selectedCondominio);
      }
      const { data: roles, error: rolesError } = await query;

      if (rolesError) throw rolesError;

      const userIds = [...new Set((roles || []).map((r) => r.user_id))];

      if (userIds.length === 0) {
        toast.warning("Nenhum usuário encontrado para este filtro.");
        setSending(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("send-push", {
        body: {
          user_ids: userIds,
          title: titulo.trim(),
          body: mensagem.trim(),
        },
      });

      if (error) throw error;

      toast.success(
        `Notificação enviada! ${data?.sent || 0} de ${data?.total || 0} dispositivos receberam.`
      );
      setTitulo("");
      setMensagem("");
    } catch (err: any) {
      console.error("Push error:", err);
      toast.error("Erro ao enviar notificação: " + (err.message || "erro desconhecido"));
    } finally {
      setSending(false);
    }
  };

  return (
    <MasterLayout title="Push Notifications">
      <Card className="rounded-[var(--radius-card)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell size={18} className="text-primary" />
            Enviar Notificação Push
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Condomínio</label>
            <Select value={selectedCondominio} onValueChange={setSelectedCondominio}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os condomínios</SelectItem>
                {condominios.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Título</label>
            <Input
              placeholder="Ex: Aviso importante"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={100}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Mensagem</label>
            <Textarea
              placeholder="Ex: Reunião de condomínio amanhã às 19h"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              maxLength={500}
              rows={4}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleSend}
            disabled={sending || !titulo.trim() || !mensagem.trim()}
          >
            {sending ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : (
              <Send className="mr-2" size={16} />
            )}
            {sending ? "Enviando..." : "Enviar Notificação"}
          </Button>
        </CardContent>
      </Card>
    </MasterLayout>
  );
};

export default MasterPush;
