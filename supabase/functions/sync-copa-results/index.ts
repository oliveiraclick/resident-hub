
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log("Starting score sync...")

    // 1. Try worldcupjson.net (Real-time scores during the cup)
    let updatedCount = 0
    try {
      const worldCupJsonUrl = "https://worldcupjson.net/matches"
      const wcResponse = await fetch(worldCupJsonUrl)
      if (wcResponse.ok) {
        const wcData = await wcResponse.json()
        // The API returns matches from 2022 if not updated, but we filter by date
        const today = new Date().toISOString().split('T')[0]
        
        for (const match of wcData) {
          if (match.status === 'completed' || match.status === 'in_progress') {
            const matchDate = match.datetime.split('T')[0]
            
            // Only update if it's a 2026 match (simple check)
            if (matchDate.startsWith('2026')) {
              const { data: dbMatch } = await supabase
                .from('copa_jogos')
                .select('id, placar_home, placar_away')
                .ilike('time_home', `%${match.home_team.name}%`)
                .ilike('time_away', `%${match.away_team.name}%`)
                .filter('data_jogo', 'gte', `${matchDate}T00:00:00`)
                .filter('data_jogo', 'lte', `${matchDate}T23:59:59`)
                .single()

              if (dbMatch && (dbMatch.placar_home !== match.home_team.goals || dbMatch.placar_away !== match.away_team.goals)) {
                await supabase
                  .from('copa_jogos')
                  .update({
                    placar_home: match.home_team.goals,
                    placar_away: match.away_team.goals,
                    status: match.status === 'completed' ? 'finalizado' : 'em_andamento'
                  })
                  .eq('id', dbMatch.id)
                
                updatedCount++
              }
            }
          }
        }
      }
    } catch (e) {
      console.error("Error fetching from worldcupjson.net:", e)
    }

    // 2. Fallback to openfootball if no updates from primary
    if (updatedCount === 0) {
      const openFootballUrl = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json"
      const ofResponse = await fetch(openFootballUrl)
      if (ofResponse.ok) {
        const ofData = await ofResponse.json()
        for (const match of ofData.matches) {
          if (match.score1 !== undefined && match.score2 !== undefined) {
            const matchDate = match.date
            const { data: dbMatch } = await supabase
              .from('copa_jogos')
              .select('id, placar_home, placar_away')
              .ilike('time_home', `%${match.team1}%`)
              .ilike('time_away', `%${match.team2}%`)
              .filter('data_jogo', 'gte', `${matchDate}T00:00:00`)
              .filter('data_jogo', 'lte', `${matchDate}T23:59:59`)
              .single()

            if (dbMatch && (dbMatch.placar_home !== match.score1 || dbMatch.placar_away !== match.score2)) {
              await supabase
                .from('copa_jogos')
                .update({
                  placar_home: match.score1,
                  placar_away: match.score2,
                  status: 'finalizado'
                })
                .eq('id', dbMatch.id)
              
              updatedCount++
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: updatedCount > 0 
          ? `${updatedCount} jogos atualizados.` 
          : "Tudo atualizado! Nenhum novo resultado encontrado nas APIs.", 
        updatedCount 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
