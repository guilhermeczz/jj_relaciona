import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Store,
  Users,
  Cake,
  Gift,
  Megaphone,
  GraduationCap,
  MessageSquare,
  CalendarDays,
  MapPin,
  TrendingUp,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { StatusBadge } from '@/components/status-badge'
import { BrindeDialog } from '@/components/brinde-dialog'
import { WhatsAppDialog } from '@/components/whatsapp-dialog'
import {
  MSG_LOJA_ANIVERSARIO,
  MSG_CONTATO_ANIVERSARIO,
} from '@/lib/whatsapp'
import {
  isNextNDays,
  isThisMonth,
  formatDataBR,
  type Aniversariante,
} from '@/lib/aniversario'
import { EmptyState } from '@/components/empty-state'

export function Dashboard() {
  const { lojas, contatos, brindes, campanhas, treinamentos, interacoes } = useData()
  const { user, isAdmin } = useAuth()
  const [brindeTarget, setBrindeTarget] = useState<{ lojaId: string; contatoId?: string } | null>(null)
  const [wa, setWa] = useState<{ phone: string; message: string } | null>(null)

  const minhasLojas = useMemo(
    () => (isAdmin ? lojas : lojas.filter((l) => l.vendedor_responsavel_id === user?.id)),
    [lojas, isAdmin, user],
  )

  const aniversariantes: Aniversariante[] = useMemo(() => {
    const lista: Aniversariante[] = []
    for (const l of minhasLojas) {
      if (l.data_fundacao) {
        const d = new Date(l.data_fundacao)
        lista.push({
          tipo: 'loja',
          nome: l.nome_fantasia,
          data: l.data_fundacao,
          mes: d.getMonth() + 1,
          dia: d.getDate(),
          lojaId: l.id,
          lojaNome: l.nome_fantasia,
          telefone: l.whatsapp || l.telefone,
          vendedorNome: l.vendedor?.nome,
          vendedorId: l.vendedor_responsavel_id || undefined,
        })
      }
      const lojaContatos = contatos.filter((c) => c.loja_id === l.id && c.ativo)
      for (const c of lojaContatos) {
        if (c.data_nascimento) {
          const d = new Date(c.data_nascimento)
          lista.push({
            tipo: 'contato',
            nome: c.nome,
            data: c.data_nascimento,
            mes: d.getMonth() + 1,
            dia: d.getDate(),
            contatoId: c.id,
            lojaId: l.id,
            lojaNome: l.nome_fantasia,
            telefone: c.whatsapp || c.telefone,
            vendedorNome: l.vendedor?.nome,
            vendedorId: l.vendedor_responsavel_id || undefined,
          })
        }
      }
    }
    return lista
  }, [minhasLojas, contatos])

  const proximos7 = aniversariantes.filter((a) => isNextNDays(a))
  const aniversariantesMes = aniversariantes.filter((a) => isThisMonth(a))

  const mineBrindes = useMemo(
    () =>
      isAdmin
        ? brindes.filter((b) => b.status !== 'cancelado' && b.status !== 'enviado')
        : brindes.filter(
            (b) =>
              (b.vendedor_responsavel_id === user?.id || minhasLojas.some((l) => l.id === b.loja_id)) &&
              b.status !== 'cancelado' &&
              b.status !== 'enviado',
          ),
    [brindes, isAdmin, user, minhasLojas],
  )

  const mineCampanhas = campanhas.filter((c) => c.status === 'ativa')
  const programados = treinamentos.filter((t) => t.status === 'programado')

  const lojasSemContato = useMemo(() => {
    return minhasLojas.filter((l) => {
      const recentes = interacoes
        .filter((i) => i.loja_id === l.id && new Date(i.data_interacao) >= new Date(Date.now() - 30 * 86400000))
      const temContatoComWhatsapp = contatos.some((c) => c.loja_id === l.id && c.ativo && c.whatsapp)
      return recentes.length === 0 && !temContatoComWhatsapp
    })
  }, [minhasLojas, interacoes, contatos])

  const totalContatos = isAdmin ? contatos.length : contatos.filter((c) => minhasLojas.some((l) => l.id === c.loja_id)).length

  const cards = [
    { label: 'Lojas', value: minhasLojas.length, icon: Store },
    { label: 'Contatos', value: totalContatos, icon: Users },
    { label: 'Aniversários em 7 dias', value: proximos7.length, icon: Cake },
    { label: 'Aniversários do mês', value: aniversariantesMes.length, icon: CalendarDays },
    { label: 'Brindes pendentes', value: mineBrindes.length, icon: Gift },
    { label: 'Campanhas ativas', value: mineCampanhas.length, icon: Megaphone },
    { label: 'Treinamentos programados', value: programados.length, icon: GraduationCap },
    { label: 'Lojas sem contato recente', value: lojasSemContato.length, icon: MessageSquare },
  ]

  return (
    <div>
      <PageHeader
        title={isAdmin ? 'Visão geral' : 'Meu painel'}
        description={
          isAdmin
            ? 'Painel gerencial de todas as lojas, contatos e operação.'
            : `Você atende ${minhasLojas.length} loja(s). Acompanhe sua carteira.`
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <c.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-2 text-3xl font-bold text-brand-black">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="bg-white">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Próximos aniversariantes</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/aniversariantes">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {proximos7.length === 0 ? (
              <EmptyState title="Nenhum aniversário nos próximos 7 dias" />
            ) : (
              <div className="space-y-2">
                {proximos7.slice(0, 8).map((a, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-brand-black">{a.nome}</span>
                        <StatusBadge value={a.tipo === 'loja' ? 'loja' : 'contato'} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDataBR(a.data)} · {a.lojaNome}
                        {a.vendedorNome ? ` · ${a.vendedorNome}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="accent"
                        onClick={() =>
                          setWa({
                            phone: a.telefone ?? '',
                            message: a.tipo === 'loja' ? MSG_LOJA_ANIVERSARIO : MSG_CONTATO_ANIVERSARIO,
                          })
                        }
                      >
                        WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setBrindeTarget({
                            lojaId: a.lojaId ?? '',
                            contatoId: a.contatoId,
                          })
                        }
                      >
                        Registrar brinde
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Brindes pendentes</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/brindes">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {mineBrindes.length === 0 ? (
              <EmptyState title="Nenhum brinde pendente" />
            ) : (
              <div className="space-y-2">
                {mineBrindes.slice(0, 6).map((b) => (
                  <div key={b.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-brand-black">
                        {b.loja?.nome_fantasia}
                        {b.contato ? ` · ${b.contato.nome}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {b.motivo?.replace('_', ' ')} · prev. {formatDataBR(b.data_prevista)}
                      </p>
                    </div>
                    <StatusBadge value={b.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="bg-white">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Campanhas ativas</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/campanhas">Gerenciar</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {mineCampanhas.length === 0 ? (
              <EmptyState title="Nenhuma campanha ativa" />
            ) : (
              <div className="space-y-2">
                {mineCampanhas.map((c) => (
                  <div key={c.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-brand-black">{c.nome}</p>
                      <StatusBadge value={c.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDataBR(c.data_inicio)} → {formatDataBR(c.data_fim)}
                    </p>
                    {c.premio && (
                      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-brand-black">
                        <TrendingUp className="h-3 w-3" /> Prêmio: {c.premio}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Treinamentos programados</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/treinamentos">Gerenciar</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {programados.length === 0 ? (
              <EmptyState title="Nenhum treinamento programado" />
            ) : (
              <div className="space-y-2">
                {programados.map((t) => (
                  <div key={t.id} className="rounded-lg border p-3">
                    <p className="font-medium text-brand-black">{t.nome}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> {formatDataBR(t.data)}
                        {t.horario ? ` às ${t.horario?.slice(0, 5)}` : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {t.local ?? '-'}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BrindeDialog
        open={!!brindeTarget}
        onOpenChange={(o) => !o && setBrindeTarget(null)}
        lojaId={brindeTarget?.lojaId}
        contatoId={brindeTarget?.contatoId}
      />
      <WhatsAppDialog
        open={!!wa}
        onOpenChange={(o) => !o && setWa(null)}
        phone={wa?.phone}
        defaultMessage={wa?.message ?? ''}
      />
    </div>
  )
}
