import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Official FIFA World Cup 2026 Fixtures (Extracted from Google Search)
const matches = [
  {
    time_home: "México",
    time_away: "África do Sul",
    data_jogo: "2026-06-11T12:00:00Z",
    rodada: "Grupo A",
    is_brasil_game: false,
    status: "agendado",
    local: "Cidade do México, México",
    estadio: "Estádio Azteca"
  },
  {
    time_home: "Coreia do Sul",
    time_away: "Tchéquia",
    data_jogo: "2026-06-11T19:00:00Z",
    rodada: "Grupo A",
    is_brasil_game: false,
    status: "agendado",
    local: "México",
    estadio: "A confirmar"
  },
  {
    time_home: "Canadá",
    time_away: "Bósnia e Herzegovina",
    data_jogo: "2026-06-12T12:00:00Z",
    rodada: "Grupo B",
    is_brasil_game: false,
    status: "agendado",
    local: "Toronto, Canadá",
    estadio: "BMO Field"
  },
  {
    time_home: "Estados Unidos",
    time_away: "Paraguai",
    data_jogo: "2026-06-12T18:00:00Z",
    rodada: "Grupo D",
    is_brasil_game: false,
    status: "agendado",
    local: "Los Angeles, EUA",
    estadio: "SoFi Stadium"
  },
  {
    time_home: "Catar",
    time_away: "Suíça",
    data_jogo: "2026-06-13T12:00:00Z",
    rodada: "Grupo B",
    is_brasil_game: false,
    status: "agendado",
    local: "Canadá",
    estadio: "A confirmar"
  },
  {
    time_home: "Brasil",
    time_away: "Marrocos",
    data_jogo: "2026-06-13T15:00:00Z",
    rodada: "Grupo C",
    is_brasil_game: true,
    status: "agendado",
    local: "A confirmar",
    estadio: "A confirmar"
  },
  {
    time_home: "Haiti",
    time_away: "Escócia",
    data_jogo: "2026-06-13T18:00:00Z",
    rodada: "Grupo C",
    is_brasil_game: false,
    status: "agendado",
    local: "A confirmar",
    estadio: "A confirmar"
  },
  {
    time_home: "Austrália",
    time_away: "Turquia",
    data_jogo: "2026-06-13T21:00:00Z",
    rodada: "Grupo D",
    is_brasil_game: false,
    status: "agendado",
    local: "EUA",
    estadio: "A confirmar"
  },
  {
    time_home: "Alemanha",
    time_away: "Curaçao",
    data_jogo: "2026-06-14T10:00:00Z",
    rodada: "Grupo E",
    is_brasil_game: false,
    status: "agendado",
    local: "A confirmar",
    estadio: "A confirmar"
  },
  {
    time_home: "Países Baixos",
    time_away: "Japão",
    data_jogo: "2026-06-14T13:00:00Z",
    rodada: "Grupo F",
    is_brasil_game: false,
    status: "agendado",
    local: "A confirmar",
    estadio: "A confirmar"
  },
  {
    time_home: "Costa do Marfim",
    time_away: "Equador",
    data_jogo: "2026-06-14T16:00:00Z",
    rodada: "Grupo E",
    is_brasil_game: false,
    status: "agendado",
    local: "A confirmar",
    estadio: "A confirmar"
  },
  {
    time_home: "Suécia",
    time_away: "Tunísia",
    data_jogo: "2026-06-14T19:00:00Z",
    rodada: "Grupo F",
    is_brasil_game: false,
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

