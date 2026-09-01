import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const USERNAME_DOMAIN = 'usuarios.construjota.com.br'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authorization = request.headers.get('Authorization') ?? ''

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    })
    const { data: { user }, error: userError } = await callerClient.auth.getUser()
    if (userError || !user) throw new Error('Sessão inválida.')

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('perfil, ativo')
      .eq('id', user.id)
      .single()

    if (callerProfile?.perfil !== 'admin' || !callerProfile.ativo) {
      return Response.json({ error: 'Apenas administradores podem criar usuários.' }, { status: 403, headers: corsHeaders })
    }

    const body = await request.json()
    const nome = String(body.nome ?? '').trim()
    const username = String(body.username ?? '').trim().toLowerCase()
    const senha = String(body.senha ?? '')
    const perfil = body.perfil === 'admin' ? 'admin' : 'vendedor'
    const telefone = body.telefone ? String(body.telefone) : null

    if (nome.length < 2) throw new Error('Informe o nome completo.')
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) throw new Error('Username inválido.')
    if (!/^\d{6}$/.test(senha)) throw new Error('A senha deve conter exatamente 6 números.')

    const email = `${username}@${USERNAME_DOMAIN}`
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome, username, perfil, telefone },
    })
    if (error) throw error

    return Response.json({ id: data.user.id, username }, { status: 201, headers: corsHeaders })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível criar o usuário.'
    return Response.json({ error: message }, { status: 400, headers: corsHeaders })
  }
})
