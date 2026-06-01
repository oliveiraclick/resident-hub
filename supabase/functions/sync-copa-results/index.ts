
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

    // 1. Fetch data from openfootball (as fallback/primary for schedule)
    const openFootballUrl = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json"
    const response = await fetch(openFootballUrl)
    const data = await response.json()

    if (!data.matches) {
      throw new Error("No matches found in provider data")
    }

    let updatedCount = 0
    
    // 2. Loop through matches and update scores if they exist
    for (const match of data.matches) {
      // openfootball uses score1, score2
      if (match.score1 !== undefined && match.score2 !== undefined) {
        // Find match in our DB
        // Matching by teams (considering translations) and date is tricky, 
        // but we can try to match by date and team names
        const matchDate = new Date(match.date).toISOString().split('T')[0]
        
        // We need to handle translations or use a standardized name
        // For now, let's try a fuzzy match or assume the names match (they should if we imported from here)
        
        const { data: dbMatch, error: findError } = await supabase
          .from('copa_jogos')
          .select('id, placar_home, placar_away')
          .or(`and(time_home.ilike.%${match.team1}%,time_away.ilike.%${match.team2}%)`)
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

    // 3. Optional: Try worldcupjson.net if matches start
    // (Implementation omitted for brevity but can be added here)

    return new Response(
      JSON.stringify({ message: `Sync complete. ${updatedCount} matches updated.`, updatedCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
