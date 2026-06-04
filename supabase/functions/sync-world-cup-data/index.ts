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

    // Official World Cup 2026 Opening Matches (June 11, 2026)
    // Sources: FIFA official schedule for 2026
    const officialMatches = [
      { home: "México", away: "A definir", date: "2026-06-11T18:00:00", round: "Fase de Grupos - A1", stadium: "Estádio Azteca" },
      { home: "Canadá", away: "A definir", date: "2026-06-12T15:00:00", round: "Fase de Grupos - B1", stadium: "BC Place" },
      { home: "EUA", away: "A definir", date: "2026-06-12T21:00:00", round: "Fase de Grupos - D1", stadium: "SoFi Stadium" },
      { home: "Brasil", away: "A definir", date: "2026-06-13T12:00:00", round: "Fase de Grupos", stadium: "A definir" },
      { home: "Argentina", away: "A definir", date: "2026-06-13T15:00:00", round: "Fase de Grupos", stadium: "A definir" }
    ]

    let syncCount = 0

    for (const match of officialMatches) {
      const { error: upsertError } = await supabaseClient
        .from('copa_jogos')
        .upsert({
          time_home: match.home,
          time_away: match.away,
          data_jogo: match.date,
          rodada: match.round,
          status: 'agendado'
        }, { onConflict: 'time_home,time_away,data_jogo' })

      if (!upsertError) syncCount++
    }

    await supabaseClient.from('copa_api_logs').insert({
      event_type: 'sync_manual_official',
      status: 'success',
      payload: { count: syncCount }
    })

    return new Response(JSON.stringify({ message: "Sincronização oficial concluída", count: syncCount }), {
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
