import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const TesteSupabase = () => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("condominios").select("*").then(({ data, error }) => {
      if (error) setError(JSON.stringify(error, null, 2));
      else setData(data);
    });
  }, []);

  return (
    <div>
      <h1>Teste Supabase - condominios</h1>
      {error && <pre style={{ color: "red" }}>{error}</pre>}
      <pre>{data ? JSON.stringify(data, null, 2) : "Carregando..."}</pre>
    </div>
  );
};

export default TesteSupabase;
