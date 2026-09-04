import { createClient } from 'npm:@supabase/supabase-js@^2'

interface ConviteEmail {
  id: string
  treinamento_id: string
  loja_id: string
  contato_id: string | null
  destinatario_nome: string
  destinatario_email: string
  email_validado: boolean
  assunto: string
  dados: Record<string, unknown>
  tentativas: number
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim()
  if (!value) throw new Error(`Variável ${name} não configurada`)
  return value
}

Deno.serve(async (request) => {
  try {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Método não permitido' }, { status: 405 })
    }

    const workerSecret = requiredEnv('EMAIL_WORKER_SECRET')
    if (request.headers.get('authorization') !== `Bearer ${workerSecret}`) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = createClient(
      requiredEnv('SUPABASE_URL'),
      requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    )
    const serverUrl = requiredEnv('EMAIL_SERVER_URL')
    const serverToken = requiredEnv('EMAIL_SERVER_TOKEN')
    const fromEmail = requiredEnv('EMAIL_FROM')
    const fromName = Deno.env.get('EMAIL_FROM_NAME')?.trim() || 'ConstruJota Relaciona'
    const requireValidation = Deno.env.get('EMAIL_REQUIRE_VALIDATION') === 'true'

    let query = supabase
      .from('convites_email')
      .select('id, treinamento_id, loja_id, contato_id, destinatario_nome, destinatario_email, email_validado, assunto, dados, tentativas')
      .in('status', ['pendente', 'erro'])
      .not('destinatario_email', 'is', null)
      .lt('tentativas', 5)
      .lte('agendado_para', new Date().toISOString())
      .order('created_at')
      .limit(25)

    if (requireValidation) query = query.eq('email_validado', true)

    const { data, error } = await query
    if (error) throw error

    let enviados = 0
    let erros = 0
    for (const convite of (data ?? []) as ConviteEmail[]) {
      const { data: reservado } = await supabase
        .from('convites_email')
        .update({ status: 'processando', tentativas: convite.tentativas + 1, ultimo_erro: null })
        .eq('id', convite.id)
        .in('status', ['pendente', 'erro'])
        .select('id')
        .maybeSingle()

      if (!reservado) continue

      try {
        const response = await fetch(serverUrl, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${serverToken}`,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            from: { email: fromEmail, name: fromName },
            to: { email: convite.destinatario_email, name: convite.destinatario_nome },
            subject: convite.assunto,
            template: 'convite_treinamento',
            data: convite.dados,
            metadata: {
              conviteId: convite.id,
              treinamentoId: convite.treinamento_id,
              lojaId: convite.loja_id,
              contatoId: convite.contato_id,
            },
          }),
        })

        if (!response.ok) throw new Error(`Servidor de e-mail respondeu HTTP ${response.status}`)
        const result = await response.json().catch(() => ({})) as { id?: string }
        await supabase.from('convites_email').update({
          status: 'enviado',
          enviado_at: new Date().toISOString(),
          provider_id: result.id ?? response.headers.get('x-message-id'),
        }).eq('id', convite.id)
        enviados += 1
      } catch (sendError) {
        await supabase.from('convites_email').update({
          status: 'erro',
          ultimo_erro: sendError instanceof Error ? sendError.message : 'Falha desconhecida no envio',
        }).eq('id', convite.id)
        erros += 1
      }
    }

    return Response.json({ processados: enviados + erros, enviados, erros })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Falha ao processar a fila' },
      { status: 500 },
    )
  }
})
