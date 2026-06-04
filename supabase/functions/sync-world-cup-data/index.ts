import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const teamFlags: Record<string, string> = {
  "México": "https://flagcdn.com/w160/mx.png",
  "África do Sul": "https://flagcdn.com/w160/za.png",
  "Coreia do Sul": "https://flagcdn.com/w160/kr.png",
  "Tchéquia": "https://flagcdn.com/w160/cz.png",
  "Canadá": "https://flagcdn.com/w160/ca.png",
  "Bósnia": "https://flagcdn.com/w160/ba.png",
  "Estados Unidos": "https://flagcdn.com/w160/us.png",
  "Paraguai": "https://flagcdn.com/w160/py.png",
  "Austrália": "https://flagcdn.com/w160/au.png",
  "Turquia": "https://flagcdn.com/w160/tr.png",
  "Catar": "https://flagcdn.com/w160/qa.png",
  "Suíça": "https://flagcdn.com/w160/ch.png",
  "Brasil": "https://flagcdn.com/w160/br.png",
  "Marrocos": "https://flagcdn.com/w160/ma.png",
  "Haiti": "https://flagcdn.com/w160/ht.png",
  "Escócia": "https://flagcdn.com/w160/gb-sct.png",
  "Alemanha": "https://flagcdn.com/w160/de.png",
  "Curaçao": "https://flagcdn.com/w160/cw.png",
  "Holanda": "https://flagcdn.com/w160/nl.png",
  "Japão": "https://flagcdn.com/w160/jp.png",
  "Costa do Marfim": "https://flagcdn.com/w160/ci.png",
  "Equador": "https://flagcdn.com/w160/ec.png",
  "Suécia": "https://flagcdn.com/w160/se.png",
  "Tunísia": "https://flagcdn.com/w160/tn.png",
  "Espanha": "https://flagcdn.com/w160/es.png",
  "Cabo Verde": "https://flagcdn.com/w160/cv.png",
  "Bélgica": "https://flagcdn.com/w160/be.png",
  "Egito": "https://flagcdn.com/w160/eg.png",
  "Arábia Saudita": "https://flagcdn.com/w160/sa.png",
  "Uruguai": "https://flagcdn.com/w160/uy.png",
  "Irã": "https://flagcdn.com/w160/ir.png",
  "Nova Zelândia": "https://flagcdn.com/w160/nz.png",
  "França": "https://flagcdn.com/w160/fr.png",
  "Senegal": "https://flagcdn.com/w160/sn.png",
  "Iraque": "https://flagcdn.com/w160/iq.png",
  "Noruega": "https://flagcdn.com/w160/no.png",
  "Argentina": "https://flagcdn.com/w160/ar.png",
  "Argélia": "https://flagcdn.com/w160/dz.png",
  "Áustria": "https://flagcdn.com/w160/at.png",
  "Jordânia": "https://flagcdn.com/w160/jo.png",
  "Portugal": "https://flagcdn.com/w160/pt.png",
  "RD Congo": "https://flagcdn.com/w160/cd.png",
  "Inglaterra": "https://flagcdn.com/w160/gb-eng.png",
  "Croácia": "https://flagcdn.com/w160/hr.png",
  "Gana": "https://flagcdn.com/w160/gh.png",
  "Panamá": "https://flagcdn.com/w160/pa.png",
  "Uzbequistão": "https://flagcdn.com/w160/uz.png",
  "Colômbia": "https://flagcdn.com/w160/co.png"
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

    await supabaseClient.from('copa_jogos').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    const { error: insertError } = await supabaseClient
      .from('copa_jogos')
      .insert(
        matches.map(m => ({
          time_home: m.home,
          time_away: m.away,
          data_jogo: m.date,
          rodada: m.round,
          status: 'agendado',
          is_brasil_game: m.home === 'Brasil' || m.away === 'Brasil',
          time_home_logo_url: teamFlags[m.home] || null,
          time_away_logo_url: teamFlags[m.away] || null
        }))
      )

    if (insertError) throw insertError

    return new Response(JSON.stringify({ message: "Jogos e bandeiras sincronizados", count: matches.length }), {
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