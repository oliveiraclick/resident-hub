import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const TesteAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);

      const { data: condominios } = await supabase.from("condominios").select("*");
      setData(condominios);
    };
    load();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <h2>Usuário:</h2>
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <h2>Condomínios:</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default TesteAuth;
