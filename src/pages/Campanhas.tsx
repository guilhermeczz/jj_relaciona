import { useState } from 'react'
import { Plus, Megaphone, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { CampanhaDialog } from '@/components/campanha-dialog'
import { ParParticipantesDialog } from '@/components/par-participantes-dialog'
import { useData } from '@/context/DataContext'
import { formatDataBR } from '@/lib/aniversario'
import type { Campanha } from '@/types'

export function Campanhas() {
  const { campanhas } = useData()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Campanha | null>(null)
  const [participantesDa, setParticipantesDa] = useState<Campanha | null>(null)

  return (
    <div>
      <PageHeader
        title="Campanhas"
        description="Campanhas comerciais e seus participantes."
        actions={
          <Button variant="accent" onClick={() => { setEditando(null); setDialogOpen(true) }}>
            <Plus className="h-4 w-4" /> Nova campanha
          </Button>
        }
      />

      {campanhas.length === 0 ? (
        <EmptyState icon={<Megaphone className="h-8 w-8" />} title="Nenhuma campanha criada" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campanhas.map((c) => (
            <Card key={c.id} className="bg-white">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-brand-black">{c.nome}</h3>
                  <StatusBadge value={c.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDataBR(c.data_inicio)} → {formatDataBR(c.data_fim)}
                </p>
                {c.premio && <p className="mt-2 text-sm font-medium text-brand-black">Prêmio: {c.premio}</p>}
                {c.regra && <p className="mt-1 text-sm text-muted-foreground">Regra: {c.regra}</p>}
                {c.produto_marca && <p className="mt-1 text-xs text-muted-foreground">Produto/Marca: {c.produto_marca}</p>}
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setParticipantesDa(c)}>
                    Gerenciar participantes
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditando(c); setDialogOpen(true) }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CampanhaDialog open={dialogOpen} onOpenChange={setDialogOpen} campanha={editando} />
      <ParParticipantesDialog
        tipo="campanha"
        open={!!participantesDa}
        onOpenChange={(o) => !o && setParticipantesDa(null)}
        campanha={participantesDa}
      />
    </div>
  )
}
