import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  Cake,
  CalendarDays,
  Gift,
  GraduationCap,
  MapPin,
  MessageSquarePlus,
  Plus,
  Store,
  HeartHandshake,
  Users,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { formatDataBR, isNextNDays, type Aniversariante } from '@/lib/aniversario'
import type { Loja } from '@/types'

const formatNumber = new Intl.NumberFormat('pt-BR')

function MetricCard({ label, value, helper, icon: Icon, dark = false }: {
  label: string
  value: string | number
  helper: string
  icon: typeof Store
  dark?: boolean
}) {
  return (
    <Card className={dark ? 'border-transparent bg-brand-black text-white' : 'bg-white'}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={dark ? 'text-xs font-medium text-white/55' : 'text-xs font-medium text-muted-foreground'}>{label}</p>
            <p className="mt-2 text-2xl font-extrabold tracking-tight sm:text-[28px]">{value}</p>
            <p className={dark ? 'mt-1 text-[11px] text-white/45' : 'mt-1 text-[11px] text-muted-foreground'}>{helper}</p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-brand-black">
            <Icon className="h-5 w-5" strokeWidth={2.2} />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function SectionTitle({ title, to, link = 'Ver todos' }: { title: string; to: string; link?: string }) {
  return (
    <CardHeader className="flex-row items-center justify-between space-y-0 border-b px-5 py-4">
      <CardTitle className="text-sm font-bold">{title}</CardTitle>
      <Link to={to} className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
        {link} <ArrowRight className="h-3 w-3" />
      </Link>
    </CardHeader>
  )
}

function buildBirthdays(lojas: Loja[], contatos: ReturnType<typeof useData>['contatos']) {
  const list: Aniversariante[] = []
  lojas.forEach((loja) => {
    if (loja.data_fundacao) {
      const date = new Date(`${loja.data_fundacao}T12:00:00`)
      list.push({
        tipo: 'loja', nome: loja.nome_fantasia, data: loja.data_fundacao,
        mes: date.getMonth() + 1, dia: date.getDate(), lojaId: loja.id,
        lojaNome: loja.nome_fantasia, telefone: loja.whatsapp || loja.telefone,
      })
    }
    contatos.filter((contato) => contato.loja_id === loja.id && contato.ativo && contato.data_nascimento).forEach((contato) => {
      const date = new Date(`${contato.data_nascimento}T12:00:00`)
      list.push({
        tipo: 'contato', nome: contato.nome, data: contato.data_nascimento!,
        mes: date.getMonth() + 1, dia: date.getDate(), contatoId: contato.id,
        lojaId: loja.id, lojaNome: loja.nome_fantasia,
        telefone: contato.whatsapp || contato.telefone,
      })
    })
  })
  return list.filter((item) => isNextNDays(item)).slice(0, 5)
}

function AdminDashboard() {
  const { lojas, contatos, brindes, treinamentos, interacoes } = useData()
  const birthdays = useMemo(() => buildBirthdays(lojas, contatos), [lojas, contatos])
  const pendingGifts = brindes.filter((gift) => gift.status === 'pendente' || gift.status === 'separado')
  const scheduledTrainings = treinamentos.filter((training) => training.status === 'programado')

  const monthlyActivity = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - index))
      const amount = interacoes.filter((interaction) => {
        const interactionDate = new Date(interaction.data_interacao)
        return interactionDate.getMonth() === date.getMonth() && interactionDate.getFullYear() === date.getFullYear()
      }).length
      return { label: formatter.format(date).replace('.', ''), amount }
    })
  }, [interacoes])
  const maxActivity = Math.max(...monthlyActivity.map((item) => item.amount), 1)
  const registeredGifts = brindes.filter((gift) => gift.status === 'enviado').length
  const giftProgress = brindes.length ? Math.round((registeredGifts / brindes.length) * 100) : 0

  return (
    <div className="mx-auto max-w-[1480px]">
      <div className="mb-5 lg:hidden">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a7800]">Visão administrativa</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">Resumo da operação</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <MetricCard label="Lojas cadastradas" value={formatNumber.format(lojas.length)} helper="Carteira total da equipe" icon={Store} />
        <MetricCard label="Contatos cadastrados" value={formatNumber.format(contatos.length)} helper="Contatos ativos nas lojas" icon={Users} />
        <MetricCard label="Próximos aniversários" value={birthdays.length} helper="Nos próximos 7 dias" icon={Cake} />
        <MetricCard label="Brindes pendentes" value={pendingGifts.length} helper="Aguardando andamento" icon={Gift} dark />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
        <Card className="overflow-hidden bg-white">
          <SectionTitle title="Próximos aniversariantes" to="/aniversariantes" />
          <CardContent className="p-0">
            {birthdays.length ? (
              <div className="divide-y">
                {birthdays.map((item, index) => (
                  <div key={`${item.tipo}-${item.nome}-${index}`} className="grid grid-cols-[48px_1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[62px_1.3fr_1fr_auto] sm:px-5">
                    <p className="text-xs font-bold text-brand-black">{formatDataBR(item.data).slice(0, 5)}</p>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.lojaNome}</p>
                      <p className="truncate text-[11px] text-muted-foreground sm:hidden">{item.nome}</p>
                    </div>
                    <p className="hidden truncate text-xs text-muted-foreground sm:block">{item.nome}</p>
                    <Link aria-label={`Abrir ${item.lojaNome}`} to={`/lojas/${item.lojaId}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ))}
              </div>
            ) : <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhum aniversário nos próximos 7 dias.</p>}
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-white">
          <SectionTitle title="Atividade recente" to="/interacoes" link="Histórico" />
          <CardContent className="space-y-3 p-4">
            {interacoes.slice(0, 3).map((interaction) => (
              <div key={interaction.id} className="flex items-center gap-3 rounded-xl border p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-[#9a7800]"><MessageSquarePlus className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{interaction.loja?.nome_fantasia ?? 'Loja'}</p>
                  <p className="mt-1 truncate text-[10px] text-muted-foreground">{interaction.tipo} · {formatDataBR(interaction.data_interacao)}</p>
                </div>
              </div>
            ))}
            {!interacoes.length && <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma interação registrada.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
        <Card className="overflow-hidden bg-white">
          <SectionTitle title="Engajamento da equipe" to="/relatorios" link="Relatórios" />
          <CardContent className="px-5 pb-5 pt-6">
            <div className="flex h-44 items-end gap-3 sm:gap-5">
              {monthlyActivity.map((item) => (
                <div key={item.label} className="flex h-full flex-1 flex-col justify-end gap-2 text-center">
                  <span className="text-[10px] font-semibold text-muted-foreground">{item.amount}</span>
                  <div className="mx-auto w-full max-w-12 rounded-t-lg bg-accent transition-all" style={{ height: `${Math.max((item.amount / maxActivity) * 100, 7)}%` }} />
                  <span className="text-[10px] capitalize text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <Card className="overflow-hidden bg-white">
            <SectionTitle title="Próximos treinamentos" to="/treinamentos" />
            <CardContent className="space-y-3 p-4">
              {scheduledTrainings.slice(0, 2).map((training) => (
                <div key={training.id} className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500"><CalendarDays className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{training.nome}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{formatDataBR(training.data)} {training.horario ? `· ${training.horario.slice(0, 5)}` : ''}</p>
                  </div>
                </div>
              ))}
              {!scheduledTrainings.length && <p className="py-4 text-center text-xs text-muted-foreground">Nenhum treinamento programado.</p>}
            </CardContent>
          </Card>

          <Card className="bg-brand-black text-white">
            <CardContent className="flex items-center gap-5 p-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-[8px] border-accent text-lg font-extrabold">{giftProgress}%</div>
              <div>
                <p className="text-sm font-bold">Registro de brindes</p>
                <p className="mt-1 text-xs text-white/55">{registeredGifts} de {brindes.length} concluídos</p>
                <Link to="/brindes" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent">Ver detalhes <ArrowRight className="h-3 w-3" /></Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function SellerDashboard() {
  const { profile, user } = useAuth()
  const { lojas, contatos, treinamentos, brindes, interacoes } = useData()
  const myStores = lojas.filter((store) => store.vendedor_responsavel_id === user?.id)
  const myStoreIds = new Set(myStores.map((store) => store.id))
  const birthdays = useMemo(() => buildBirthdays(myStores, contatos), [myStores, contatos])
  const scheduledTrainings = treinamentos.filter((training) => training.status === 'programado')
  const now = new Date()
  const monthInteractions = interacoes.filter((interaction) => {
    const date = new Date(interaction.data_interacao)
    return myStoreIds.has(interaction.loja_id) && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
  }).length
  const pendingGifts = brindes.filter((gift) =>
    myStoreIds.has(gift.loja_id) && (gift.status === 'pendente' || gift.status === 'separado'),
  ).length

  const quickActions = [
    { to: '/lojas', label: 'Minhas lojas', value: myStores.length, icon: Store, highlighted: true },
    { to: '/lojas', label: 'Cadastrar loja', value: 'Nova', icon: Plus },
    { to: '/aniversariantes', label: 'Aniversariantes', value: birthdays.length, icon: Cake },
    { to: '/brindes', label: 'Brindes', value: pendingGifts, icon: Gift },
    { to: '/treinamentos', label: 'Treinamentos', value: scheduledTrainings.length, icon: GraduationCap, wide: true },
  ]

  return (
    <div className="-mx-4 -mt-5 sm:-mx-6 lg:mx-auto lg:mt-0 lg:max-w-6xl">
      <section className="relative overflow-hidden bg-[#121212] px-5 pb-8 pt-6 text-white sm:px-8 lg:rounded-[28px] lg:p-8">
        <div className="absolute right-[-90px] top-[-90px] h-64 w-64 rounded-full border-[55px] border-white/[0.025]" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm text-white/55">Bem-vindo de volta,</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{profile?.nome.split(' ')[0]} <span aria-hidden="true">👋</span></h1>
            <p className="mt-2 text-xs text-white/45">Acompanhe suas atividades e seu progresso.</p>
          </div>
          <button aria-label="Notificações" className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
          </button>
        </div>

        <div className="relative mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-brand-black"><HeartHandshake className="h-5 w-5" /></span>
            <div><p className="text-sm font-bold">Seu relacionamento este mês</p><p className="mt-0.5 text-[11px] text-white/45">Tudo o que merece sua atenção agora.</p></div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-white/10 rounded-xl bg-black/20 py-3 text-center">
            <div><p className="text-lg font-extrabold text-accent">{monthInteractions}</p><p className="mt-1 text-[9px] text-white/45">Interações</p></div>
            <div><p className="text-lg font-extrabold text-accent">{birthdays.length}</p><p className="mt-1 text-[9px] text-white/45">Aniversários</p></div>
            <div><p className="text-lg font-extrabold text-accent">{pendingGifts}</p><p className="mt-1 text-[9px] text-white/45">Brindes</p></div>
          </div>
        </div>
      </section>

      <div className="px-4 py-5 sm:px-6 lg:px-0 lg:py-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {quickActions.map(({ to, label, value, icon: Icon, highlighted, wide }) => (
            <Link key={label} to={to} className={`${wide ? 'col-span-2 lg:col-span-1' : ''} rounded-2xl border p-4 transition-transform active:scale-[0.98] ${highlighted ? 'border-accent/60 bg-accent' : 'bg-white'}`}>
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${highlighted ? 'bg-white/60' : 'bg-muted'}`}><Icon className="h-5 w-5" /></span>
              <p className="mt-4 text-xs font-semibold">{label}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{typeof value === 'number' ? `${value} ${value === 1 ? 'item' : 'itens'}` : value}</p>
            </Link>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="overflow-hidden bg-white">
            <SectionTitle title="Minhas lojas" to="/lojas" />
            <CardContent className="divide-y p-0">
              {myStores.slice(0, 5).map((store) => (
                <Link key={store.id} to={`/lojas/${store.id}`} className="flex min-h-[70px] items-center gap-3 px-4 py-3 hover:bg-muted/60">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20 text-[#9a7800]"><Store className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{store.nome_fantasia}</p><p className="mt-1 flex items-center gap-1 truncate text-[11px] text-muted-foreground"><MapPin className="h-3 w-3" /> {store.cidade ?? 'Cidade não informada'}{store.estado ? ` · ${store.estado}` : ''}</p></div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              ))}
              {!myStores.length && <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhuma loja vinculada à sua carteira.</p>}
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="bg-brand-black text-white">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-xs text-white/50">Próximos aniversários</p><p className="mt-2 text-3xl font-extrabold text-accent">{birthdays.length}</p><p className="mt-1 text-xs text-white/45">nos próximos 7 dias</p></div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-accent"><Cake className="h-5 w-5" /></span>
                </div>
                <Link to="/aniversariantes" className="mt-5 flex items-center gap-1 text-xs font-semibold text-accent">Abrir agenda <ArrowRight className="h-3 w-3" /></Link>
              </CardContent>
            </Card>
            <Button asChild variant="accent" size="lg" className="w-full">
              <Link to="/interacoes"><MessageSquarePlus className="h-5 w-5" /> Registrar nova interação</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { isAdmin } = useAuth()
  return isAdmin ? <AdminDashboard /> : <SellerDashboard />
}
