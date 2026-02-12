import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MasterLayout from "@/components/MasterLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Package, PackageCheck, Wrench, ShoppingBag, Tag } from "lucide-react";

interface Metricas {
  totalPacotesRecebidos: number;
  totalPacotesRetirados: number;
  totalPrestadores: number;
  totalProdutosAtivos: number;
  totalDesapegosAtivos: number;
}

const MasterMetricas = () => {
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [pacRecRes, pacRetRes, prestRes, prodRes, desRes] = await Promise.all([
        supabase.from("pacotes").select("id").eq("status", "RECEBIDO"),
        supabase.from("pacotes").select("id").eq("status", "RETIRADO"),
        supabase.from("prestadores").select("id"),
        supabase.from("produtos").select("id").eq("status", "ativo"),
        supabase.from("desapegos").select("id").eq("status", "ativo"),
      ]);

      setMetricas({
        totalPacotesRecebidos: (pacRecRes.data || []).length,
        totalPacotesRetirados: (pacRetRes.data || []).length,
        totalPrestadores: (prestRes.data || []).length,
        totalProdutosAtivos: (prodRes.data || []).length,
        totalDesapegosAtivos: (desRes.data || []).length,
      });
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <MasterLayout title="Métricas">
        <p className="text-muted-foreground">Carregando...</p>
      </MasterLayout>
    );
  }

  const items = [
    { label: "Pacotes Recebidos", value: metricas?.totalPacotesRecebidos, icon: Package },
    { label: "Pacotes Retirados", value: metricas?.totalPacotesRetirados, icon: PackageCheck },
    { label: "Prestadores", value: metricas?.totalPrestadores, icon: Wrench },
    { label: "Produtos Ativos", value: metricas?.totalProdutosAtivos, icon: ShoppingBag },
    { label: "Desapegos Ativos", value: metricas?.totalDesapegosAtivos, icon: Tag },
  ];

  return (
    <MasterLayout title="Métricas">
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.label} className="rounded-[var(--radius-card)]">
            <CardContent className="p-4 flex items-center gap-3">
              <item.icon className="text-primary" size={24} />
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-lg font-bold">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MasterLayout>
  );
};

export default MasterMetricas;
