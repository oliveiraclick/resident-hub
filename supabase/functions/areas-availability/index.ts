
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')?.trim();
    const externalToken = Deno.env.get('EXTERNAL_AI_API_KEY')?.trim();

    if (externalToken) {
      console.log(`Debug: Secret found. Length: ${externalToken.length}, Starts with: ${externalToken.substring(0, 3)}...`);
    } else {
      console.error('CRITICAL: EXTERNAL_AI_API_KEY secret is not set!');
    }

    const isValid = authHeader === `Bearer ${externalToken}` || 
                    authHeader === externalToken ||
                    (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === externalToken);

    if (!authHeader || !isValid) {
      console.log(`Unauthorized. Header length: ${authHeader?.length}, Match: ${isValid}`);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const date = url.searchParams.get('date')
    const category = url.searchParams.get('category')

    if (!date) {
      return new Response(
        JSON.stringify({ error: 'Missing date parameter (YYYY-MM-DD)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Get areas (optionally filtered by category)
    let areasQuery = supabaseClient.from('espacos').select('id, nome, categoria')
    if (category) {
      areasQuery = areasQuery.ilike('categoria', category)
    }
    const { data: areas, error: areasError } = await areasQuery

    if (areasError) throw areasError

    // 2. Get reservations for that date
    const { data: reservations, error: resError } = await supabaseClient
      .from('reservas')
      .select('espaco_id, status')
      .eq('data', date)
      .eq('status', 'confirmada')

    if (resError) throw resError

    const reservedIds = new Set(reservations?.map(r => r.espaco_id) || [])

    const available_areas = areas.map(area => ({
      category: area.categoria || 'geral',
      name: area.nome,
      status: reservedIds.has(area.id) ? 'reservado' : 'disponível'
    }))

    return new Response(
      JSON.stringify({
        date,
        available_areas
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
