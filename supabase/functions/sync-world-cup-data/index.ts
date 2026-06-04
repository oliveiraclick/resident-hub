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

    // Fetch fixtures from TheSportsDB (using a free endpoint for demonstration)
    // In a production app, you'd use a specific 2026 World Cup endpoint
    const response = await fetch('https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4429')
    const data = await response.json()

    if (data && data.events) {
      for (const event of data.events) {
        // Map API data to our copa_jogos table
        const { error: upsertError } = await supabaseClient
          .from('copa_jogos')
          .upsert({
            time_home: event.strHomeTeam,
            time_away: event.strAwayTeam,
            data_jogo: event.strTimestamp || `${event.dateEvent}T${event.strTime}`,
            rodada: event.strRound || 'Fase de Grupos',
            status: 'agendado'
          }, { onConflict: 'time_home,time_away,data_jogo' })

        if (upsertError) console.error('Error upserting game:', upsertError)
      }

      await supabaseClient.from('copa_api_logs').insert({
        event_type: 'sync',
        status: 'success',
        payload: { count: data.events.length }
      })
    }

    return new Response(JSON.stringify({ message: "Sync complete", count: data.events?.length || 0 }), {
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
