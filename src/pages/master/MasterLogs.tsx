import { useEffect, useState } from "react";
import MasterLayout from "@/components/MasterLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Trash2, AlertCircle, ChevronLeft, ChevronRight, Phone } from "lucide-react";
import { toast } from "sonner";

interface AuthLog {
  id: string;
  email: string | null;
  nome: string | null;
  evento: string;
  erro: string | null;
  detalhes: string | null;
  created_at: string;
}

interface SimilarEmail {
  email: string;
  nome: string;
}

const PAGE_SIZE = 30;

const MasterLogs = () => {
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [similarEmails, setSimilarEmails] = useState<Record<string, SimilarEmail[]>>({});
  const [phones, setPhones] = useState<Record<string, string>>({});

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("auth_logs")
      .select("id, email, nome, evento, erro, detalhes, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    const logsData = (data as AuthLog[]) || [];
    setLogs(logsData);
    setLoading(false);

    // Fetch phones for all unique emails
    const allEmails = [...new Set(logsData.filter(l => l.email).map(l => l.email!))];
    if (allEmails.length > 0) {
      const { data: phoneData } = await supabase.rpc("get_phones_by_emails", { _emails: allEmails });
      if (phoneData) {
        const phoneMap: Record<string, string> = {};
        (phoneData as { email: string; telefone: string }[]).forEach(p => { phoneMap[p.email] = p.telefone; });
        setPhones(phoneMap);
      }
    }

    // Fetch similar emails for login errors
    const errorEmails = [...new Set(
      logsData
        .filter((l) => l.evento === "login_error" && l.email)
        .map((l) => l.email!)
    )];

    const results: Record<string, SimilarEmail[]> = {};
    await Promise.all(
      errorEmails.map(async (email) => {
        const { data: similar } = await supabase.rpc("find_similar_emails", { _target_email: email });
        if (similar && similar.length > 0) {
          results[email] = similar as SimilarEmail[];
        }
      })
    );
    setSimilarEmails(results);
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleClearAll = async () => {
    const { error } = await supabase.from("auth_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) toast.error("Erro ao limpar logs");
    else { toast.success("Logs limpos"); fetchLogs(); }
  };

  const filtered = search
    ? logs.filter(
        (l) =>
          l.email?.toLowerCase().includes(search.toLowerCase()) ||
          l.nome?.toLowerCase().includes(search.toLowerCase()) ||
          l.erro?.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  const eventColors: Record<string, string> = {
    login_error: "bg-destructive/10 text-destructive",
    login_success: "bg-primary/10 text-primary",
    signup_error: "bg-warning/20 text-foreground",
    oauth_error: "bg-destructive/10 text-destructive",
  };

  return (
    <MasterLayout title="Logs de Autenticação">
      <div className="sticky top-0 z-10 bg-background pb-3 mb-4 space-y-3 -mx-5 px-5 pt-1">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por email, nome ou erro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{filtered.length} registro(s)</p>
          {logs.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAll} className="text-xs">
              <Trash2 size={14} className="mr-1" />
              Limpar todos
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <AlertCircle size={40} className="text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Nenhum log encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map((log) => (
            <Card key={log.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${eventColors[log.evento] || "bg-muted text-muted-foreground"}`}>
                        {log.evento.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    {log.nome && <p className="text-sm font-medium mt-1">{log.nome}</p>}
                    {log.email && <p className="text-xs text-muted-foreground">{log.email}</p>}
                    {log.email && phones[log.email] && (
                      <button
                        type="button"
                        onClick={() => {
                          const phoneDigits = phones[log.email].replace(/\D/g, "");
                          const whatsappUrl = `https://wa.me/55${phoneDigits}`;
                          const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
                          if (!popup) {
                            toast.error(`Não foi possível abrir o WhatsApp. Número: ${phones[log.email]}`);
                          }
                        }}
                        className="inline-flex items-center gap-1 text-xs text-primary mt-0.5 hover:underline"
                      >
                        <Phone size={12} />
                        {phones[log.email]}
                      </button>
                    )}
                    {log.erro && (
                      <p className="text-xs text-destructive mt-1 break-all">❌ {log.erro}</p>
                    )}
                    {log.evento === "login_error" && log.email && similarEmails[log.email] && (
                      <div className="mt-2 p-2 rounded-md bg-primary/5 border border-primary/20">
                        <p className="text-xs font-medium text-primary">💡 Email similar encontrado:</p>
                        {similarEmails[log.email].map((s) => (
                          <p key={s.email} className="text-xs text-foreground mt-0.5">
                            O email cadastrado é <strong>{s.email}</strong>
                            {s.nome ? ` (${s.nome})` : ""} mas tentou logar com <strong>{log.email}</strong>
                          </p>
                        ))}
                      </div>
                    )}
                    {log.detalhes && (
                      <p className="text-[11px] text-muted-foreground mt-1 break-all">{log.detalhes}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 py-4">
              <Button variant="outline" size="icon" className="h-9 w-9" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[80px] text-center">{page} / {totalPages}</span>
              <Button variant="outline" size="icon" className="h-9 w-9" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </div>
      )}
    </MasterLayout>
  );
};

export default MasterLogs;
