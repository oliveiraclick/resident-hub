import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_GROUPS } from "@/lib/iconMap";

export interface CategoriaServico {
  id: string;
  nome: string;
  icone: string;
  grupo: string;
  ordem: number;
  ativo: boolean;
}

export interface CategoriaGrupo {
  group: string;
  items: CategoriaServico[];
}

export const useCategorias = () => {
  const [categorias, setCategorias] = useState<CategoriaServico[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("categorias_servico")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });
      
      if (error) throw error;
      setCategorias((data as CategoriaServico[]) || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  // Grouped by SERVICE_GROUPS order
  const grouped: CategoriaGrupo[] = SERVICE_GROUPS
    .map((group) => ({
      group,
      items: categorias.filter((c) => c.grupo === group),
    }))
    .filter((g) => g.items.length > 0);

  return { categorias, grouped, loading, refetch: fetch };
};
