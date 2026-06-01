import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Official FIFA World Cup 2026 Opening Fixtures (Corrected)
const matches = [
  {
    time_home: "México",
    time_away: "A confirmar",
    data_jogo: "2026-06-11T19:00:00Z",
    rodada: "Grupo A - Jogo 1 (Abertura)",
    is_brasil_game: false,
    status: "agendado",
    local: "Cidade do México, México",
    estadio: "Estádio Azteca"
  },
  {
    time_home: "Canadá",
    time_away: "A confirmar",
    data_jogo: "2026-06-12T17:00:00Z",
    rodada: "Grupo B - Jogo 3",
    is_brasil_game: false,
    status: "agendado",
    local: "Toronto, Canadá",
    estadio: "BMO Field"
  },
  {
    time_home: "Estados Unidos",
    time_away: "A confirmar",
    data_jogo: "2026-06-12T19:00:00Z",
    rodada: "Grupo D - Jogo 4",
    is_brasil_game: false,
    status: "agendado",
    local: "Los Angeles, EUA",
    estadio: "SoFi Stadium"
  },
  {
    time_home: "Brasil",
    time_away: "A confirmar",
    data_jogo: "2026-06-14T18:00:00Z",
    rodada: "Grupo G - Jogo 1",
    is_brasil_game: true,
    status: "agendado",
    local: "A confirmar",
    estadio: "A confirmar"
  }
];

Deno.serve(async (req) => {
  try {
    const { error } = await supabase
      .from("copa_jogos")
      .upsert(matches, { onConflict: 'time_home,time_away,data_jogo' });

    if (error) throw error;

    return new Response(JSON.stringify({ message: "Jogos da Copa 2026 atualizados!", count: matches.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

