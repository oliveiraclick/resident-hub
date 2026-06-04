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

    // Using a more reliable source for 2026 World Cup data (GitHub OpenFootball as fallback)
    const response = await fetch('https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json')
    const data = await response.json()

    let syncCount = 0

    if (data && data.rounds) {
      for (const round of data.rounds) {
        if (round.matches) {
          for (const match of round.matches) {
            const { error: upsertError } = await supabaseClient
              .from('copa_jogos')
              .upsert({
                time_home: match.team1,
                time_away: match.team2,
                data_jogo: `${match.date}T${match.time || '12:00:00'}`,
                rodada: round.name || 'Fase de Grupos',
                status: 'agendado'
              }, { onConflict: 'time_home,time_away,data_jogo' })

            if (!upsertError) syncCount++
          }
        }
      }

      await supabaseClient.from('copa_api_logs').insert({
        event_type: 'sync',
        status: 'success',
        payload: { count: syncCount }
      })
    }

    return new Response(JSON.stringify({ message: "Sync complete", count: syncCount }), {
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
