import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ENCOMENDA_STATUSES = ['RECEBIDO', 'TRIADO', 'AGUARDANDO_RETIRADA', 'AGUARDANDO_CONFIRMACAO']
const PROFILE_PAGE_SIZE = 1000
const MAX_PROFILE_ROWS_TO_SCAN = 10000

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const normalizePhone = (value?: string | null) => (value || '').replace(/\D/g, '')

const phoneCandidates = (value?: string | null) => {
  const digits = normalizePhone(value)
  const candidates = new Set<string>()

  if (!digits) return candidates

  candidates.add(digits)

  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    candidates.add(digits.slice(2))
  }

  if (digits.startsWith('0')) {
    candidates.add(digits.replace(/^0+/, ''))
  }

  if (digits.length >= 11) candidates.add(digits.slice(-11))
  if (digits.length >= 10) candidates.add(digits.slice(-10))

  return candidates
}

const phonesMatch = (storedPhone?: string | null, providedPhone?: string | null) => {
  const stored = phoneCandidates(storedPhone)
  const provided = phoneCandidates(providedPhone)

  for (const value of stored) {
    if (provided.has(value)) return true
  }

  return false
}

async function findMoradorByPhone(supabaseClient: ReturnType<typeof createClient>, phone: string, condominioId?: string | null) {
  let from = 0
  const matchedProfiles: Array<{ user_id: string; nome: string; telefone: string | null }> = []

  while (from < MAX_PROFILE_ROWS_TO_SCAN) {
    const to = from + PROFILE_PAGE_SIZE - 1
    const { data: profiles, error } = await supabaseClient
      .from('profiles')
      .select('user_id, nome, telefone')
      .not('telefone', 'is', null)
      .range(from, to)

    if (error) throw error
    if (!profiles?.length) break

    for (const profile of profiles) {
      if (phonesMatch(profile.telefone, phone)) {
        matchedProfiles.push(profile as { user_id: string; nome: string; telefone: string | null })
      }
    }

    if (profiles.length < PROFILE_PAGE_SIZE) break
    from += PROFILE_PAGE_SIZE
  }

  if (matchedProfiles.length === 0) return { status: 'not_found' as const }

  const userIds = [...new Set(matchedProfiles.map((profile) => profile.user_id))]
  let rolesQuery = supabaseClient
    .from('user_roles')
    .select('user_id, condominio_id, role, aprovado')
    .in('user_id', userIds)
    .eq('role', 'morador')
    .eq('aprovado', true)

  if (condominioId) rolesQuery = rolesQuery.eq('condominio_id', condominioId)

  const { data: roles, error: rolesError } = await rolesQuery
  if (rolesError) throw rolesError

  const matches = (roles || [])
    .map((role) => {
      const profile = matchedProfiles.find((item) => item.user_id === role.user_id)
      if (!profile || !role.condominio_id) return null
      return {
        user_id: profile.user_id,
        nome: profile.nome,
        telefone: profile.telefone,
        condominio_id: role.condominio_id as string,
      }
    })
    .filter(Boolean) as Array<{ user_id: string; nome: string; telefone: string | null; condominio_id: string }>

  if (matches.length === 0) return { status: 'not_found' as const }

  const distinctCondominios = new Set(matches.map((match) => match.condominio_id))
  if (!condominioId && distinctCondominios.size > 1) {
    return { status: 'ambiguous' as const, matches }
  }

  return { status: 'found' as const, morador: matches[0] }
}

async function handleEncomendasLookup(req: Request, supabaseClient: ReturnType<typeof createClient>) {
  const url = new URL(req.url)
  let body: Record<string, unknown> = {}

  if (req.method === 'POST') {
    body = await req.json().catch(() => ({}))
  }

  const phone = String(body.phone || body.telefone || url.searchParams.get('phone') || url.searchParams.get('telefone') || '').trim()
  const condominioId = String(body.condominio_id || url.searchParams.get('condominio_id') || '').trim() || null

  if (!phone) {
    return jsonResponse({ error: 'Missing phone parameter', required: ['phone'] }, 400)
  }

  const moradorResult = await findMoradorByPhone(supabaseClient, phone, condominioId)

  if (moradorResult.status === 'not_found') {
    return jsonResponse({
      ok: false,
      error: 'morador_nao_encontrado',
      message: 'Nenhum morador aprovado foi encontrado com este telefone.',
      total: 0,
      encomendas: [],
      available_areas: [{ category: 'encomendas', name: 'Encomendas', status: 'morador não encontrado' }],
    }, 404)
  }

  if (moradorResult.status === 'ambiguous') {
    return jsonResponse({
      ok: false,
      error: 'condominio_id_required',
      message: 'Este telefone aparece em mais de um condomínio. Envie também o condominio_id para identificar o morador correto.',
    }, 409)
  }

  const morador = moradorResult.morador

  const { data: encomendas, error: encomendasError } = await supabaseClient
    .from('pacotes')
    .select('id, descricao, status, created_at, recebido_em, codigo_rastreio, lotes(entregador)')
    .eq('morador_id', morador.user_id)
    .eq('condominio_id', morador.condominio_id)
    .in('status', ENCOMENDA_STATUSES)
    .order('created_at', { ascending: false })

  if (encomendasError) throw encomendasError

  const lista = (encomendas || []).map((pacote) => ({
    id: pacote.id,
    descricao: pacote.descricao || 'Encomenda',
    entregador: (pacote.lotes as { entregador?: string } | null)?.entregador || 'Não informado',
    status: pacote.status === 'AGUARDANDO_CONFIRMACAO'
      ? 'Aguardando confirmação no app'
      : pacote.status === 'AGUARDANDO_RETIRADA'
        ? 'Disponível na portaria'
        : 'Recebida pela portaria',
    recebido_em: pacote.recebido_em || pacote.created_at,
    codigo: pacote.codigo_rastreio || 'N/A',
  }))

  const total = lista.length

  return jsonResponse({
    ok: true,
    tipo: 'encomendas',
    morador: { nome: morador.nome },
    total,
    encomendas: lista,
    mensagem_sugerida: total > 0
      ? `Olá ${morador.nome}, você tem ${total} encomenda(s) aguardando retirada na portaria.`
      : `Olá ${morador.nome}, não encontrei nenhuma encomenda pendente para você no momento.`,
    available_areas: total > 0
      ? lista.map((item) => ({ category: 'encomendas', name: item.descricao, status: item.status }))
      : [{ category: 'encomendas', name: 'Encomendas', status: 'nenhuma pendente' }],
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')?.trim()
    const externalToken = Deno.env.get('EXTERNAL_AI_API_KEY')?.trim()

    const isValid = Boolean(externalToken) && (
      authHeader === `Bearer ${externalToken}` ||
      authHeader === externalToken ||
      (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === externalToken)
    )

    if (!authHeader || !isValid) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    const url = new URL(req.url)
    const category = url.searchParams.get('category')
    const normalizedCategory = (category || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (normalizedCategory.includes('encomenda') || normalizedCategory.includes('pacote')) {
      return await handleEncomendasLookup(req, supabaseClient)
    }

    const date = url.searchParams.get('date')

    if (!date) {
      return jsonResponse({ error: 'Missing date parameter (YYYY-MM-DD)' }, 400)
    }

    let areasQuery = supabaseClient.from('espacos').select('id, nome, categoria')
    if (category) {
      areasQuery = areasQuery.ilike('categoria', category)
    }
    const { data: areas, error: areasError } = await areasQuery

    if (areasError) throw areasError

    const now = new Date()
    const currentTime = now.toLocaleTimeString('pt-BR', { hour12: false })

    const { data: reservations, error: resError } = await supabaseClient
      .from('reservas')
      .select('espaco_id, status')
      .eq('data', date)
      .eq('status', 'confirmada')
      .lte('horario_inicio', currentTime)
      .gte('horario_fim', currentTime)

    if (resError) throw resError

    const reservedIds = new Set(reservations?.map(r => r.espaco_id) || [])

    const available_areas = (areas || []).map(area => ({
      category: area.categoria || 'geral',
      name: area.nome,
      status: reservedIds.has(area.id) ? 'reservado' : 'disponível'
    }))

    return jsonResponse({ date, available_areas })
  } catch (error) {
    console.error('areas-availability error', error)
    return jsonResponse({ error: 'Não foi possível consultar a disponibilidade no momento.' }, 500)
  }
})
