import { useState } from 'react'
import { Plus, GraduationCap, Pencil, CalendarDays, MapPin, Users2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { TreinamentoDialog } from '@/components/treinamento-dialog'
import { ParParticipantesDialog } from '@/components/par-participantes-dialog'
import { useData } from '@/context/DataContext'
import { formatDataBR } from '@/lib/aniversario'
import type { Treinamento } from '@/types'

export function Treinamentos() {
  const { treinamentos, treinamentoParticipantes } = useData()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Treinamento | null>(null)
  const [participantesDa, setParticipantesDa] = useState<Treinamento | null>(null)

  const inscritos = (id: string) => treinamentoParticipantes.filter((p) => p.treinamento_id === id).length
  const confirmados = (id: string) => treinamentoParticipantes.filter((p) => p.treinamento_id === id && p.confirmado).length

  return (
    <div>
      <PageHeader
        title="Treinamentos"
        description="Treinamentos externos para lojas e contatos."
        actions={
          <Button variant="accent" onClick={() => { setEditando(null); setDialogOpen(true) }}>
            <Plus className="h-4 w-4" /> Novo treinamento
          </Button>
        }
      />

      {treinamentos.length === 0 ? (
        <EmptyState icon={<GraduationCap className="h-8 w-8" />} title="Nenhum treinamento criado" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {treinamentos.map((t) => (
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
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setParticipantesDa(t)}>
                    Participantes
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditando(t); setDialogOpen(true) }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TreinamentoDialog open={dialogOpen} onOpenChange={setDialogOpen} treinamento={editando} />
      <ParParticipantesDialog
        tipo="treinamento"
        open={!!participantesDa}
        onOpenChange={(o) => !o && setParticipantesDa(null)}
        treinamento={participantesDa}
      />
    </div>
  )
}
