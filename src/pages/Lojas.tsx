import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, Store, MessageCircle, MapPin } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { LojaDialog } from '@/components/loja-dialog'
import { WhatsAppDialog } from '@/components/whatsapp-dialog'
import { EmptyState } from '@/components/empty-state'
import { DateRangeFilter } from '@/components/date-range-filter'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { comparePtBr, isWithinDateRange } from '@/lib/filters'
import { ListPagination } from '@/components/list-pagination'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FilterField } from '@/components/filter-field'

const PAGE_SIZE = 30

export function Lojas() {
  const { lojas, contatos, profiles } = useData()
  const { user, isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const aba = searchParams.get('aba') === 'inativas' ? 'inativas' : 'ativas'
  const [fVendedor, setFVendedor] = useState('')
  const [fCidade, setFCidade] = useState('')
  const [fSegmento, setFSegmento] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [wa, setWa] = useState<{ phone: string; message: string; nome: string } | null>(null)

  const vendedores = profiles.filter((p) => p.perfil === 'vendedor')
  const minhasLojas = useMemo(
    () => (isAdmin ? lojas : lojas.filter((l) => l.criado_por === user?.id)),
    [lojas, isAdmin, user],
  )
  const cidades = [...new Set(minhasLojas.map((loja) => loja.cidade).filter((cidade): cidade is string => Boolean(cidade)))].sort(comparePtBr)
  const segmentos = [...new Set(minhasLojas.map((loja) => loja.segmento).filter((segmento): segmento is string => Boolean(segmento)))].sort(comparePtBr)
  const totalAtivas = minhasLojas.filter((loja) => loja.status === 'ativo').length
  const totalInativas = minhasLojas.filter((loja) => loja.status === 'inativo').length

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return minhasLojas.filter((l) => {
      const matchTerm =
        !term ||
        l.nome_fantasia.toLowerCase().includes(term) ||
        (l.cnpj ?? '').toLowerCase().includes(term) ||
        (l.cidade ?? '').toLowerCase().includes(term)
      const matchV = !fVendedor || l.vendedor_responsavel_id === fVendedor
      const matchAba = aba === 'inativas' ? l.status === 'inativo' : l.status === 'ativo'
      const matchC = !fCidade || l.cidade === fCidade
      const matchSegmento = !fSegmento || l.segmento === fSegmento
      const matchDate = isWithinDateRange(l.created_at, dataInicio, dataFim)
      return matchTerm && matchV && matchAba && matchC && matchSegmento && matchDate
    }).sort((a, b) => comparePtBr(a.nome_fantasia, b.nome_fantasia))
  }, [minhasLojas, search, fVendedor, aba, fCidade, fSegmento, dataInicio, dataFim])
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => setPage(1), [search, fVendedor, aba, fCidade, fSegmento, dataInicio, dataFim])

  const contatosDaLoja = (lojaId: string) =>
    contatos.filter((c) => c.loja_id === lojaId && c.ativo).length

  return (
    <div>
      <PageHeader
        title="Lojas"
        description={isAdmin ? 'Todas as lojas clientes.' : 'Lojas da sua carteira.'}
        actions={
          <Button variant="accent" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Nova loja
          </Button>
        }
      />

      <Tabs
        value={aba}
        onValueChange={(value) => setSearchParams(value === 'inativas' ? { aba: 'inativas' } : {})}
        className="mb-4"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="ativas">Ativas ({totalAtivas})</TabsTrigger>
          <TabsTrigger value="inativas">Inativas ({totalInativas})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <FilterField label="Pesquisa" className="flex-1 sm:min-w-64">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center" aria-hidden="true"><Search className="h-4 w-4 text-muted-foreground" /></span>
            <Input className="pl-9" placeholder="Nome, CNPJ ou cidade..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </FilterField>
        {isAdmin && <FilterField label="Vendedor"><Select value={fVendedor || 'todos'} onValueChange={(value) => setFVendedor(value === 'todos' ? '' : value)}>
          <SelectTrigger className="sm:w-48"><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos</SelectItem>{vendedores.map((v) => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}</SelectContent>
        </Select></FilterField>}
        <FilterField label="Cidade"><Select value={fCidade || 'todas'} onValueChange={(value) => setFCidade(value === 'todas' ? '' : value)}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="Todas" /></SelectTrigger>
          <SelectContent><SelectItem value="todas">Todas as cidades</SelectItem>{cidades.map((cidade) => <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>)}</SelectContent>
        </Select></FilterField>
        <FilterField label="Segmento"><Select value={fSegmento || 'todos'} onValueChange={(value) => setFSegmento(value === 'todos' ? '' : value)}>
          <SelectTrigger className="sm:w-52"><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos os segmentos</SelectItem>{segmentos.map((segmento) => <SelectItem key={segmento} value={segmento}>{segmento}</SelectItem>)}</SelectContent>
        </Select></FilterField>
        <DateRangeFilter inicio={dataInicio} fim={dataFim} onInicioChange={setDataInicio} onFimChange={setDataFim} label="Cadastro" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Store className="h-8 w-8" />}
          title={aba === 'inativas' ? 'Nenhuma loja inativa' : 'Nenhuma loja ativa encontrada'}
          description={aba === 'inativas' ? 'As lojas inativadas aparecerão aqui.' : 'Cadastre uma nova loja ou ajuste os filtros.'}
          action={
            <Button variant="accent" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Nova loja
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden bg-white">
          <CardContent className="divide-y p-0">
          {pageItems.map((l) => (
            <div key={l.id} className="grid gap-3 p-4 transition-colors hover:bg-muted/40 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <Link to={`/lojas/${l.id}`} className="font-semibold text-brand-black hover:underline">
                      {l.nome_fantasia}
                    </Link>
                    {l.cidade && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {l.cidade}{l.estado ? ` - ${l.estado}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="min-w-0 text-xs leading-5 text-muted-foreground">
                    <p>Vendedor: {l.vendedor?.nome ?? '-'}</p>
                    {isAdmin && <p>Cadastrada por: {l.criador?.nome ?? '-'}</p>}
                    <p>{l.segmento ?? 'Segmento não informado'} · {contatosDaLoja(l.id)} contato(s)</p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <StatusBadge value={l.status} />
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/lojas/${l.id}`}>Detalhes</Link>
                    </Button>
                  <Button
                    size="sm"
                    variant="accent"
                    title="Conversar pelo WhatsApp"
                    aria-label={`Conversar com ${l.nome_fantasia} pelo WhatsApp`}
                    onClick={() =>
                      setWa({
                        phone: l.whatsapp ?? '',
                        message: `Olá, ${l.nome_fantasia}! Tudo bem? Somos da equipe JJ/ConstruJota.`,
                        nome: l.nome_fantasia,
                      })
                    }
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  </div>
            </div>
          ))}
          </CardContent>
        </Card>
      )}
      {filtered.length > 0 && <ListPagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} itemLabel="lojas" />}

      <LojaDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <WhatsAppDialog
        open={!!wa}
        onOpenChange={(o) => !o && setWa(null)}
        phone={wa?.phone}
        defaultMessage={wa?.message ?? ''}
        title={`WhatsApp · ${wa?.nome ?? ''}`}
      />
    </div>
  )
}
