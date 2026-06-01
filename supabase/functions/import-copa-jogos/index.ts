import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Simulated data for World Cup 2026 Opening Rounds (Mocking API response)
const matches = [
  {
    time_home: "Canadá",
    time_away: "Coreia do Norte",
    data_jogo: "2026-06-11T16:00:00Z",
    rodada: "Grupo A - Rodada 1",
    is_brasil_game: false,
    status: "agendado"
  },
  {
    time_home: "México",
    time_away: "Equador",
    data_jogo: "2026-06-11T19:00:00Z",
    rodada: "Grupo B - Rodada 1",
    is_brasil_game: false,
    status: "agendado"
  },
  {
    time_home: "Estados Unidos",
    time_away: "Argélia",
    data_jogo: "2026-06-12T20:00:00Z",
    rodada: "Grupo D - Rodada 1",
    is_brasil_game: false,
    status: "agendado"
  },
  {
    time_home: "Brasil",
    time_away: "Irlanda",
    data_jogo: "2026-06-13T15:00:00Z",
    rodada: "Grupo G - Rodada 1",
    is_brasil_game: true,
    status: "agendado"
  },
  {
    time_home: "França",
    time_away: "Arábia Saudita",
    data_jogo: "2026-06-14T18:00:00Z",
    rodada: "Grupo C - Rodada 1",
    is_brasil_game: false,
    status: "agendado"
  },
  {
    time_home: "Argentina",
    time_away: "Uzbequistão",
    data_jogo: "2026-06-15T21:00:00Z",
    rodada: "Grupo F - Rodada 1",
    is_brasil_game: false,
    status: "agendado"
  }
];

Deno.serve(async (req) => {
  try {
    const { error } = await supabase
      .from("copa_jogos")
      .upsert(matches, { onConflict: 'time_home,time_away,data_jogo' });

    if (error) throw error;

    return new Response(JSON.stringify({ message: "Jogos atualizados com sucesso!", count: matches.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
