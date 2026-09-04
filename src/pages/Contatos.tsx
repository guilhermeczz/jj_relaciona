import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Users, MessageCircle, Pencil, Trash2 } from 'lucide-react'
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
import { Card, CardContent } from '@/components/ui/card'
import { CargoTraducao } from '@/components/status-badge'
import { ContatoDialog } from '@/components/contato-dialog'
import { WhatsAppDialog } from '@/components/whatsapp-dialog'
import { EmptyState } from '@/components/empty-state'
import { DateRangeFilter } from '@/components/date-range-filter'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { comparePtBr, isWithinDateRange } from '@/lib/filters'
import { CARGOS } from '@/components/contato-dialog'
import { ListPagination } from '@/components/list-pagination'
import { ConfirmDialog } from '@/components/confirm-dialog'
import type { Contato } from '@/types'
import { FilterField } from '@/components/filter-field'

const PAGE_SIZE = 30

export function Contatos() {
  const { contatos, lojas, loadAll } = useData()
  const { user, isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [fLoja, setFLoja] = useState('')
  const [fCargo, setFCargo] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<null | { lojaId: string; contato: any }>(null)
  const [wa, setWa] = useState<{ phone: string; message: string } | null>(null)
  const [excluindo, setExcluindo] = useState<Contato | null>(null)
  const [deleting, setDeleting] = useState(false)

  const lojasVisiveis = useMemo(
    () => (isAdmin ? lojas : lojas.filter((l) => l.criado_por === user?.id)),
    [lojas, isAdmin, user],
  )
  const lojaIds = new Set(lojasVisiveis.map((l) => l.id))
  const visiveis = contatos.filter((c) => lojaIds.has(c.loja_id))

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return visiveis.filter((c) => {
      const matchTerm =
        !term ||
        c.nome.toLowerCase().includes(term) ||
        (c.email ?? '').toLowerCase().includes(term) ||
        (c.whatsapp ?? '').toLowerCase().includes(term)
      const matchL = !fLoja || c.loja_id === fLoja
      const matchCargo = !fCargo || c.cargo === fCargo
      const matchDate = isWithinDateRange(c.created_at, dataInicio, dataFim)
      return matchTerm && matchL && matchCargo && matchDate
    }).sort((a, b) => comparePtBr(a.nome, b.nome))
  }, [visiveis, search, fLoja, fCargo, dataInicio, dataFim])
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => setPage(1), [search, fLoja, fCargo, dataInicio, dataFim])

  async function excluirContato() {
    if (!excluindo) return
    setDeleting(true)
    const { error } = await supabase.from('contatos_loja').delete().eq('id', excluindo.id)
    setDeleting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Contato excluído')
    setExcluindo(null)
    await loadAll()
  }

  return (
    <div>
      <PageHeader
        title="Contatos"
        description="Vendedores e representantes das lojas clientes."
        actions={
          <Button variant="accent" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Novo contato
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <FilterField label="Pesquisa" className="flex-1 sm:min-w-64">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center" aria-hidden="true"><Search className="h-4 w-4 text-muted-foreground" /></span>
            <Input className="pl-9" placeholder="Nome, e-mail ou WhatsApp..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </FilterField>
        <FilterField label="Loja"><Select value={fLoja || 'todas'} onValueChange={(value) => setFLoja(value === 'todas' ? '' : value)}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as lojas</SelectItem>
            {[...lojasVisiveis].sort((a, b) => comparePtBr(a.nome_fantasia, b.nome_fantasia)).map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.nome_fantasia}
              </SelectItem>
            ))}
          </SelectContent>
        </Select></FilterField>
        <FilterField label="Cargo"><Select value={fCargo || 'todos'} onValueChange={(value) => setFCargo(value === 'todos' ? '' : value)}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos os cargos</SelectItem>{CARGOS.map((cargo) => <SelectItem key={cargo} value={cargo}>{CargoTraducao(cargo)}</SelectItem>)}</SelectContent>
        </Select></FilterField>
        <DateRangeFilter inicio={dataInicio} fim={dataFim} onInicioChange={setDataInicio} onFimChange={setDataFim} label="Cadastro" />
      </div>

      <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        Utilize os dados cadastrados apenas para relacionamento comercial autorizado com a loja e seus
        representantes.
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Nenhum contato encontrado"
          action={
            <Button variant="accent" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Novo contato
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden bg-white">
          <CardContent className="divide-y p-0">
          {pageItems.map((c) => (
            <div key={c.id} className="grid gap-3 p-4 transition-colors hover:bg-muted/40 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-black">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">{CargoTraducao(c.cargo)}</p>
                    <Link to={`/lojas/${c.loja_id}`} className="mt-0.5 block truncate text-xs text-muted-foreground hover:underline">
                      {c.loja?.nome_fantasia ?? '-'}
                    </Link>
                  </div>
                  <div className="min-w-0 text-xs leading-5 text-muted-foreground">
                    <p className="truncate">{c.whatsapp ?? c.email ?? '-'}</p>
                    <p className="truncate">Hobby: {c.hobby ?? '-'}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.recebe_mensagens && <span className="rounded bg-brand-gray px-1.5 py-0.5 text-[10px]">Mensagens</span>}
                      {c.recebe_treinamentos && <span className="rounded bg-brand-gray px-1.5 py-0.5 text-[10px]">Treinamentos</span>}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Editar contato"
                      aria-label={`Editar ${c.nome}`}
                      onClick={() =>
                        setEditando({
                          lojaId: c.loja_id,
                          contato: c,
                        })
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="accent"
                      title="Conversar pelo WhatsApp"
                      aria-label={`Conversar com ${c.nome} pelo WhatsApp`}
                      onClick={() =>
                        setWa({
                          phone: c.whatsapp ?? '',
                          message: `Olá, ${c.nome}! Tudo bem? Somos da equipe JJ/ConstruJota.`,
                        })
                      }
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title="Excluir contato"
                      aria-label={`Excluir ${c.nome}`}
                      onClick={() => setExcluindo(c)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
            </div>
          ))}
          </CardContent>
        </Card>
      )}
      {filtered.length > 0 && <ListPagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} itemLabel="contatos" />}

      <ContatoDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <ContatoDialog
        open={!!editando}
        onOpenChange={(o) => !o && setEditando(null)}
        lojaId={editando?.lojaId}
        contato={editando?.contato ?? null}
      />
      <WhatsAppDialog
        open={!!wa}
        onOpenChange={(o) => !o && setWa(null)}
        phone={wa?.phone}
        defaultMessage={wa?.message ?? ''}
      />
      <ConfirmDialog
        open={!!excluindo}
        onOpenChange={(open) => !open && setExcluindo(null)}
        title="Excluir contato?"
        description={`Esta ação remove permanentemente ${excluindo?.nome ?? 'este contato'}. O histórico relacionado será preservado sem o vínculo com o contato.`}
        loading={deleting}
        onConfirm={excluirContato}
      />
    </div>
  )
}
