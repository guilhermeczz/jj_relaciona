import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Gift, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { BrindeDialog } from '@/components/brinde-dialog'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { formatDataBR } from '@/lib/aniversario'
import type { Brinde } from '@/types'
import { DateRangeFilter } from '@/components/date-range-filter'
import { comparePtBr, isWithinDateRange } from '@/lib/filters'
import { FilterField } from '@/components/filter-field'

const MOTIVOS = [
  { value: 'aniversario_loja', label: 'Aniversário da loja' },
  { value: 'aniversario_contato', label: 'Aniversário do contato' },
  { value: 'relacionamento', label: 'Relacionamento' },
  { value: 'outro', label: 'Outro' },
]

function nomeMotivo(value?: string | null) {
  return MOTIVOS.find((motivo) => motivo.value === value)?.label ?? value ?? 'Motivo não informado'
}

export function Brindes() {
  const { brindes, lojas, loadAll } = useData()
  const { user, isAdmin } = useAuth()
  const [params, setParams] = useSearchParams()
  const [fStatus, setFStatus] = useState('')
  const [fVendedor, setFVendedor] = useState('')
  const [fLoja, setFLoja] = useState('')
  const [fMotivo, setFMotivo] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Brinde | null>(null)

  const nova = params.get('nova')
  const lojaNova = nova || undefined

  const vendedores = useMemo(
    () => brindes.map((b) => b.vendedor?.nome).filter((n): n is string => Boolean(n)),
    [brindes],
  )

  const visiveis = useMemo(
    () =>
      isAdmin
        ? brindes
        : brindes.filter((b) => lojas.find((l) => l.id === b.loja_id)?.criado_por === user?.id),
    [brindes, isAdmin, user, lojas],
  )

  const filtered = visiveis.filter((b) => {
    const matchS = !fStatus || b.status === fStatus
    const matchV = !fVendedor || b.vendedor?.nome === fVendedor
    const matchL = !fLoja || b.loja_id === fLoja
    const matchM = !fMotivo || b.motivo === fMotivo
    const matchDate = isWithinDateRange(b.created_at, dataInicio, dataFim)
    return matchS && matchV && matchL && matchM && matchDate
  })

  async function mudarStatus(b: Brinde, novo: string) {
    const payload: Partial<Brinde> = { status: novo as Brinde['status'] }
    if (novo === 'enviado') payload.data_envio = new Date().toISOString().slice(0, 10)
    const { error } = await supabase.from('brindes').update(payload).eq('id', b.id)
    if (error) toast.error(error.message)
    else {
      toast.success('Status atualizado.')
      await loadAll()
    }
  }

  return (
    <div>
      <PageHeader
        title="Brindes"
        description="Controle de brindes oferecidos às lojas e contatos."
        actions={
          <Button
            variant="accent"
            onClick={() => {
              setEditando(null)
              setParams({})
              setDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4" /> Novo brinde
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <FilterField label="Status"><Select value={fStatus || 'todos'} onValueChange={(value) => setFStatus(value === 'todos' ? '' : value)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="separado">Separado</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select></FilterField>
        {isAdmin && <FilterField label="Vendedor"><Select value={fVendedor || 'todos'} onValueChange={(value) => setFVendedor(value === 'todos' ? '' : value)}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {vendedores.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select></FilterField>}
        <FilterField label="Loja"><Select value={fLoja || 'todas'} onValueChange={(value) => setFLoja(value === 'todas' ? '' : value)}>
          <SelectTrigger className="sm:w-52"><SelectValue placeholder="Todas" /></SelectTrigger>
          <SelectContent><SelectItem value="todas">Todas as lojas</SelectItem>{[...lojas].sort((a, b) => comparePtBr(a.nome_fantasia, b.nome_fantasia)).map((loja) => <SelectItem key={loja.id} value={loja.id}>{loja.nome_fantasia}</SelectItem>)}</SelectContent>
        </Select></FilterField>
        <FilterField label="Motivo"><Select value={fMotivo || 'todos'} onValueChange={(value) => setFMotivo(value === 'todos' ? '' : value)}>
          <SelectTrigger className="sm:w-48"><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos os motivos</SelectItem>{MOTIVOS.map((motivo) => <SelectItem key={motivo.value} value={motivo.value}>{motivo.label}</SelectItem>)}</SelectContent>
        </Select></FilterField>
        <DateRangeFilter inicio={dataInicio} fim={dataFim} onInicioChange={setDataInicio} onFimChange={setDataFim} label="Cadastro" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Gift className="h-8 w-8" />} title="Nenhum brinde encontrado" />
      ) : (
        <Card className="overflow-hidden bg-white">
          <CardContent className="divide-y p-0">
          {filtered.map((b) => (
            <div key={b.id} className="grid gap-3 p-4 transition-colors hover:bg-muted/40 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-black">{b.descricao}</p>
                    <p className="truncate text-xs leading-5 text-muted-foreground">
                      {b.loja?.nome_fantasia}
                      {b.contato ? ` · ${b.contato.nome}` : ''}
                    </p>
                  </div>
                  <div className="min-w-0 text-xs leading-5 text-muted-foreground">
                    <p>{nomeMotivo(b.motivo)}</p>
                    <p>Cadastro: {formatDataBR(b.created_at)}</p>
                    <p>Previsão: {formatDataBR(b.data_prevista)}</p>
                  </div>
                  <div className="min-w-0 text-xs leading-5 text-muted-foreground">
                    <p>Vendedor: {b.vendedor?.nome ?? '-'}</p>
                    {b.contato && <p className="truncate">Hobby: {b.contato.hobby ?? '-'}</p>}
                  </div>
                <div className="flex items-center justify-end gap-2">
                  <StatusBadge value={b.status} />
                  {b.status !== 'enviado' && b.status !== 'cancelado' && (
                    <Button size="sm" variant="outline" onClick={() => mudarStatus(b, 'enviado')}>
                      Marcar enviado
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" title="Editar brinde" aria-label={`Editar ${b.descricao}`} onClick={() => setEditando(b)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
            </div>
          ))}
          </CardContent>
        </Card>
      )}

      <BrindeDialog
        open={dialogOpen || !!editando ? true : false}
        onOpenChange={(o) => {
          if (!o) {
            setDialogOpen(false)
            setEditando(null)
            setParams({})
          }
        }}
        lojaId={editando ? undefined : lojaNova}
        brinde={editando}
      />
    </div>
  )
}
