import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Users, MessageCircle, Pencil } from 'lucide-react'
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
import { CargoTraducao, StatusBadge } from '@/components/status-badge'
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

const PAGE_SIZE = 30

export function Contatos() {
  const { contatos, lojas } = useData()
  const { user, isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [fLoja, setFLoja] = useState('')
  const [fCargo, setFCargo] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<null | { lojaId: string; contato: any }>(null)
  const [wa, setWa] = useState<{ phone: string; message: string } | null>(null)

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
      const matchStatus = !fStatus || (fStatus === 'ativo' ? c.ativo : !c.ativo)
      const matchDate = isWithinDateRange(c.created_at, dataInicio, dataFim)
      return matchTerm && matchL && matchCargo && matchStatus && matchDate
    }).sort((a, b) => comparePtBr(a.nome, b.nome))
  }, [visiveis, search, fLoja, fCargo, fStatus, dataInicio, dataFim])
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => setPage(1), [search, fLoja, fCargo, fStatus, dataInicio, dataFim])

  async function alternarAtivo(c: any) {
    const { error } = await supabase
      .from('contatos_loja')
      .update({ ativo: !c.ativo })
      .eq('id', c.id)
    if (error) toast.error(error.message)
    else toast.success(c.ativo ? 'Contato inativado' : 'Contato ativado')
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

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 sm:min-w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Pesquisar por nome, e-mail ou WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={fLoja || 'todas'} onValueChange={(value) => setFLoja(value === 'todas' ? '' : value)}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Loja" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as lojas</SelectItem>
            {[...lojasVisiveis].sort((a, b) => comparePtBr(a.nome_fantasia, b.nome_fantasia)).map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.nome_fantasia}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fCargo || 'todos'} onValueChange={(value) => setFCargo(value === 'todos' ? '' : value)}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="Cargo" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos os cargos</SelectItem>{CARGOS.map((cargo) => <SelectItem key={cargo} value={cargo}>{CargoTraducao(cargo)}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={fStatus || 'todos'} onValueChange={(value) => setFStatus(value === 'todos' ? '' : value)}>
          <SelectTrigger className="sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="ativo">Ativos</SelectItem><SelectItem value="inativo">Inativos</SelectItem></SelectContent>
        </Select>
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
            <div key={c.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1 sm:basis-52">
                    <p className="font-semibold text-brand-black">{c.nome}</p>
                    <p className="text-xs text-muted-foreground">{CargoTraducao(c.cargo)}</p>
                    <Link to={`/lojas/${c.loja_id}`} className="mt-0.5 block truncate text-xs text-muted-foreground hover:underline">
                      {c.loja?.nome_fantasia ?? '-'}
                    </Link>
                  </div>
                  <div className="min-w-0 flex-1 text-xs text-muted-foreground sm:basis-56">
                    <p className="truncate">{c.whatsapp ?? c.email ?? '-'}</p>
                    <p className="truncate">Hobby: {c.hobby ?? '-'}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.recebe_mensagens && <span className="rounded bg-brand-gray px-1.5 py-0.5 text-[10px]">Mensagens</span>}
                      {c.recebe_treinamentos && <span className="rounded bg-brand-gray px-1.5 py-0.5 text-[10px]">Treinamentos</span>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-1 sm:justify-end">
                    <StatusBadge value={c.ativo ? 'ativo' : 'inativo'} />
                    <Button
                      size="icon"
                      variant="ghost"
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
                      onClick={() =>
                        setWa({
                          phone: c.whatsapp ?? '',
                          message: `Olá, ${c.nome}! Tudo bem? Somos da equipe JJ/ConstruJota.`,
                        })
                      }
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                {isAdmin && (
                  <button
                    onClick={() => alternarAtivo(c)}
                    className="min-h-10 px-2 text-xs text-muted-foreground hover:text-brand-black"
                  >
                    {c.ativo ? 'Inativar' : 'Ativar'}
                  </button>
                )}
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
    </div>
  )
}
