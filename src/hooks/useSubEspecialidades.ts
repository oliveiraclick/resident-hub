import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SubEspecialidade {
  id: string;
  categoria_nome: string;
  nome: string;
}

export const useSubEspecialidades = (categoriaNome: string) => {
  const [subs, setSubs] = useState<SubEspecialidade[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoriaNome) {
      setSubs([]);
      return;
    }
    setLoading(true);
    supabase
      .from("sub_especialidades")
      .select("*")
      .eq("categoria_nome", categoriaNome)
      .order("nome")
      .then(({ data }) => {
        setSubs((data as SubEspecialidade[]) || []);
        setLoading(false);
      });
  }, [categoriaNome]);

  const addSub = async (nome: string) => {
    if (!categoriaNome || !nome.trim()) return;
    const { data, error } = await supabase
      .from("sub_especialidades")
      .upsert({ categoria_nome: categoriaNome, nome: nome.trim() }, { onConflict: "categoria_nome,nome" })
      .select()
      .single();
    if (!error && data) {
      setSubs((prev) => {
        if (prev.some((s) => s.nome === data.nome)) return prev;
        return [...prev, data as SubEspecialidade].sort((a, b) => a.nome.localeCompare(b.nome));
      });
    }
  };

  return { subs, loading, addSub };
};
