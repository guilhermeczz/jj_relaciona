import { useState } from 'react'
import { UserCog, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { EmptyState } from '@/components/empty-state'
import { PerfilDialog } from '@/components/perfil-dialog'
import { useData } from '@/context/DataContext'
import { formatDataBR } from '@/lib/aniversario'
import type { Profile } from '@/types'

export function Usuarios() {
  const { profiles } = useData()
  const [editando, setEditando] = useState<Profile | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Administradores e vendedores vinculados ao Supabase Auth."
      />

      {profiles.length === 0 ? (
        <EmptyState icon={<UserCog className="h-8 w-8" />} title="Nenhum usuário cadastrado" />
      ) : (
        <Card className="bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-brand-gray">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Nome</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">E-mail</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Perfil</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Telefone</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-2 text-left font-medium text-muted-foreground">Criado em</th>
                    <th className="px-4 py-2 text-right font-medium text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-2 font-medium text-brand-black">{p.nome}</td>
                      <td className="px-4 py-2">{p.email}</td>
                      <td className="px-4 py-2">
                        <StatusBadge value={p.perfil} />
                      </td>
                      <td className="px-4 py-2">{p.telefone ?? '-'}</td>
                      <td className="px-4 py-2">
                        <span className={p.ativo ? 'text-emerald-600' : 'text-muted-foreground'}>
                          {p.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{formatDataBR(p.created_at)}</td>
                      <td className="px-4 py-2 text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditando(p)
                            setDialogOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <PerfilDialog open={dialogOpen} onOpenChange={setDialogOpen} perfil={editando} />
    </div>
  )
}
