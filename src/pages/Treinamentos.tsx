import { useMemo, useState } from 'react'
import { Plus, GraduationCap, Pencil, CalendarDays, MapPin, Users2, Search } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { TreinamentoDialog } from '@/components/treinamento-dialog'
import { ParParticipantesDialog } from '@/components/par-participantes-dialog'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { formatDataBR } from '@/lib/aniversario'
import type { Treinamento } from '@/types'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DateRangeFilter } from '@/components/date-range-filter'
import { isWithinDateRange } from '@/lib/filters'
import { FilterField } from '@/components/filter-field'

export function Treinamentos() {
  const { treinamentos, treinamentoParticipantes } = useData()
  const { isAdmin } = useAuth()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Treinamento | null>(null)
  const [participantesDa, setParticipantesDa] = useState<Treinamento | null>(null)
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  const filtrados = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return treinamentos.filter((treinamento) => {
      const matchTerm = !term || treinamento.nome.toLocaleLowerCase('pt-BR').includes(term) || (treinamento.tema ?? '').toLocaleLowerCase('pt-BR').includes(term) || (treinamento.parceiro ?? '').toLocaleLowerCase('pt-BR').includes(term)
      const matchStatus = !fStatus || treinamento.status === fStatus
      const matchDate = isWithinDateRange(treinamento.data, dataInicio, dataFim)
      return matchTerm && matchStatus && matchDate
    }).sort((a, b) => (a.data ?? '9999-12-31').localeCompare(b.data ?? '9999-12-31'))
  }, [treinamentos, search, fStatus, dataInicio, dataFim])

  const inscritos = (id: string) => treinamentoParticipantes.filter((p) => p.treinamento_id === id).length
  const confirmados = (id: string) => treinamentoParticipantes.filter((p) => p.treinamento_id === id && p.confirmado).length

  return (
    <div>
      <PageHeader
        title="Treinamentos"
        description="Treinamentos externos para lojas e contatos."
        actions={isAdmin ? (
          <Button variant="accent" onClick={() => { setEditando(null); setDialogOpen(true) }}>
            <Plus className="h-4 w-4" /> Novo treinamento
          </Button>
        ) : undefined}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <FilterField label="Pesquisa" className="flex-1 sm:min-w-64">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center" aria-hidden="true"><Search className="h-4 w-4 text-muted-foreground" /></span>
            <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, tema ou parceiro..." />
          </div>
        </FilterField>
        <FilterField label="Status"><Select value={fStatus || 'todos'} onValueChange={(value) => setFStatus(value === 'todos' ? '' : value)}>
          <SelectTrigger className="sm:w-44"><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="programado">Programado</SelectItem><SelectItem value="realizado">Realizado</SelectItem><SelectItem value="cancelado">Cancelado</SelectItem></SelectContent>
        </Select></FilterField>
        <DateRangeFilter inicio={dataInicio} fim={dataFim} onInicioChange={setDataInicio} onFimChange={setDataFim} label="Treinamento" />
      </div>

      {filtrados.length === 0 ? (
        <EmptyState icon={<GraduationCap className="h-8 w-8" />} title="Nenhum treinamento criado" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((t) => (
            <Card key={t.id} className="bg-white">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-brand-black">{t.nome}</h3>
                  <StatusBadge value={t.status} />
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" /> {formatDataBR(t.data)}
                  {t.horario ? ` às ${t.horario.slice(0, 5)}` : ''}
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {t.local ?? '-'}
                </p>
                {t.parceiro && <p className="mt-1 text-xs text-muted-foreground">Parceiro: {t.parceiro}</p>}
                <p className="mt-2 flex items-center gap-1 text-sm font-medium text-brand-black">
                  <Users2 className="h-4 w-4" /> {confirmados(t.id)}/{inscritos(t.id)} confirmados
                  {t.vagas ? ` · ${t.vagas} vagas` : ''}
                </p>
                {isAdmin && <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setParticipantesDa(t)}>
                    Participantes
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditando(t); setDialogOpen(true) }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TreinamentoDialog open={dialogOpen} onOpenChange={setDialogOpen} treinamento={editando} />
      <ParParticipantesDialog
        open={!!participantesDa}
        onOpenChange={(o) => !o && setParticipantesDa(null)}
        treinamento={participantesDa}
      />
    </div>
  )
}
