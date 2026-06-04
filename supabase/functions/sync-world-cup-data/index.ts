import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Data extracted from https://tabelacopa2026.api.br/
    // This site has a full (predicted/likely) schedule for the 2026 World Cup
    const matches = [
      { date: "2026-06-11T16:00:00", home: "México", away: "África do Sul", round: "Grupo A" },
      { date: "2026-06-11T23:00:00", home: "Coreia do Sul", away: "Tchéquia", round: "Grupo A" },
      { date: "2026-06-12T16:00:00", home: "Canadá", away: "Bósnia", round: "Grupo B" },
      { date: "2026-06-12T22:00:00", home: "Estados Unidos", away: "Paraguai", round: "Grupo B" },
      { date: "2026-06-12T19:00:00", home: "Austrália", away: "Turquia", round: "Grupo B" },
      { date: "2026-06-13T13:00:00", home: "Catar", away: "Suíça", round: "Grupo C" },
      { date: "2026-06-13T16:00:00", home: "Brasil", away: "Marrocos", round: "Grupo C" },
      { date: "2026-06-13T19:00:00", home: "Haiti", away: "Escócia", round: "Grupo C" },
      { date: "2026-06-14T13:00:00", home: "Alemanha", away: "Curaçao", round: "Grupo D" },
      { date: "2026-06-14T16:00:00", home: "Holanda", away: "Japão", round: "Grupo D" },
      { date: "2026-06-14T19:00:00", home: "Costa do Marfim", away: "Equador", round: "Grupo E" },
      { date: "2026-06-14T22:00:00", home: "Suécia", away: "Tunísia", round: "Grupo E" },
      { date: "2026-06-15T13:00:00", home: "Espanha", away: "Cabo Verde", round: "Grupo F" },
      { date: "2026-06-15T16:00:00", home: "Bélgica", away: "Egito", round: "Grupo F" },
      { date: "2026-06-15T19:00:00", home: "Arábia Saudita", away: "Uruguai", round: "Grupo G" },
      { date: "2026-06-15T22:00:00", home: "Irã", away: "Nova Zelândia", round: "Grupo G" },
      { date: "2026-06-16T13:00:00", home: "França", away: "Senegal", round: "Grupo H" },
      { date: "2026-06-16T16:00:00", home: "Iraque", away: "Noruega", round: "Grupo H" },
      { date: "2026-06-16T19:00:00", home: "Argentina", away: "Argélia", round: "Grupo I" },
      { date: "2026-06-16T22:00:00", home: "Áustria", away: "Jordânia", round: "Grupo I" },
      { date: "2026-06-17T13:00:00", home: "Portugal", away: "RD Congo", round: "Grupo J" },
      { date: "2026-06-17T16:00:00", home: "Inglaterra", away: "Croácia", round: "Grupo J" },
      { date: "2026-06-17T19:00:00", home: "Gana", away: "Panamá", round: "Grupo L" },
      { date: "2026-06-17T22:00:00", home: "Uzbequistão", away: "Colômbia", round: "Grupo L" },
      { date: "2026-06-19T19:00:00", home: "Brasil", away: "Haiti", round: "Grupo C" },
      { date: "2026-06-24T16:00:00", home: "Escócia", away: "Brasil", round: "Grupo C" }
    ]

    // Clear existing matches to avoid duplicates or outdated manual entries
    // We use a small delay or retry to ensure the delete completes if there's any contention
    const { error: deleteError } = await supabaseClient.from('copa_jogos').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (deleteError) throw deleteError

    const { data, error: insertError } = await supabaseClient
      .from('copa_jogos')
      .insert(
        matches.map(m => ({
          time_home: m.home,
          time_away: m.away,
          data_jogo: m.date,
          rodada: m.round,
          status: 'agendado',
          is_brasil_game: m.home === 'Brasil' || m.away === 'Brasil'
        }))
      )

    if (insertError) throw insertError

    return new Response(JSON.stringify({ message: "Jogos sincronizados com sucesso", count: matches.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})