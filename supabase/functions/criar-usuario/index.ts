import { withSupabase } from 'npm:@supabase/server@^1'

const USERNAME_DOMAIN = 'jj.com'

interface CreateUserBody {
  nome?: unknown
  username?: unknown
  senha?: unknown
  perfil?: unknown
  telefone?: unknown
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, context) => {
    try {
      const userId = context.userClaims?.id
      if (!userId) {
        return Response.json({ error: 'Sessão inválida.' }, { status: 401 })
      }

      const profileResult = await context.supabase
        .from('profiles')
        .select('perfil, ativo')
        .eq('id', userId)
        .single()
      const callerProfile = profileResult.data as { perfil: 'admin' | 'vendedor'; ativo: boolean } | null

      if (profileResult.error || callerProfile?.perfil !== 'admin' || !callerProfile.ativo) {
        return Response.json(
          { error: 'Apenas administradores podem criar usuários.' },
          { status: 403 },
        )
      }

      const body = (await request.json()) as CreateUserBody
      const nome = String(body.nome ?? '').trim()
      const username = String(body.username ?? '').trim().toLowerCase()
      const senha = String(body.senha ?? '')
      const perfil = body.perfil === 'admin' ? 'admin' : 'vendedor'
      const telefone = body.telefone ? String(body.telefone) : null

      if (nome.length < 2) throw new Error('Informe o nome completo.')
      if (!/^[a-z0-9._-]{3,30}$/.test(username)) throw new Error('Username inválido.')
      if (!/^\d{6}$/.test(senha)) throw new Error('A senha deve conter exatamente 6 números.')

      const { data, error: createError } = await context.supabaseAdmin.auth.admin.createUser({
        email: `${username}@${USERNAME_DOMAIN}`,
        password: senha,
        email_confirm: true,
        user_metadata: { nome, username, perfil, telefone },
      })

      if (createError) throw createError

      return Response.json(
        { id: data.user.id, username },
        { status: 201 },
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível criar o usuário.'
      return Response.json({ error: message }, { status: 400 })
    }
  }),
}
