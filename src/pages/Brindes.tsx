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

export function Brindes() {
  const { brindes, lojas } = useData()
  const { user, isAdmin } = useAuth()
  const [params, setParams] = useSearchParams()
  const [fStatus, setFStatus] = useState('')
  const [fVendedor, setFVendedor] = useState('')
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
        : brindes.filter(
            (b) => b.vendedor_responsavel_id === user?.id || (b.loja && lojas.find((l) => l.id === b.loja_id)?.vendedor_responsavel_id === user?.id),
          ),
    [brindes, isAdmin, user, lojas],
  )

  const filtered = visiveis.filter((b) => {
    const matchS = !fStatus || b.status === fStatus
    const matchV = !fVendedor || b.vendedor?.nome === fVendedor
    return matchS && matchV
  })

  async function mudarStatus(b: Brinde, novo: string) {
    const payload: Partial<Brinde> = { status: novo as Brinde['status'] }
    if (novo === 'enviado') payload.data_envio = new Date().toISOString().slice(0, 10)
    const { error } = await supabase.from('brindes').update(payload).eq('id', b.id)
    if (error) toast.error(error.message)
    else toast.success('Status atualizado')
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

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Select value={fStatus || 'todos'} onValueChange={(value) => setFStatus(value === 'todos' ? '' : value)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="separado">Separado</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        {isAdmin && <Select value={fVendedor || 'todos'} onValueChange={(value) => setFVendedor(value === 'todos' ? '' : value)}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Vendedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {vendedores.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Gift className="h-8 w-8" />} title="Nenhum brinde encontrado" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <Card key={b.id} className="bg-white">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-black">{b.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.loja?.nome_fantasia}
                      {b.contato ? ` · ${b.contato.nome}` : ''}
                    </p>
                  </div>
                  <StatusBadge value={b.status} />
                </div>
                <p className="mt-2 text-xs capitalize text-muted-foreground">
                  {b.motivo?.replace('_', ' ')} · prev. {formatDataBR(b.data_prevista)}
                </p>
                <p className="text-xs text-muted-foreground">Vendedor: {b.vendedor?.nome ?? '-'}</p>
                <div className="mt-3 flex gap-2">
                  {b.status !== 'enviado' && b.status !== 'cancelado' && (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => mudarStatus(b, 'enviado')}>
                      Marcar enviado
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setEditando(b)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
