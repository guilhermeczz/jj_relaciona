import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'

export function Lojas() {
  const { lojas, contatos, profiles } = useData()
  const { user, isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [fVendedor, setFVendedor] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [wa, setWa] = useState<{ phone: string; message: string; nome: string } | null>(null)

  const vendedores = profiles.filter((p) => p.perfil === 'vendedor')
  const minhasLojas = useMemo(
    () => (isAdmin ? lojas : lojas.filter((l) => l.criado_por === user?.id)),
    [lojas, isAdmin, user],
  )

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return minhasLojas.filter((l) => {
      const matchTerm =
        !term ||
        l.nome_fantasia.toLowerCase().includes(term) ||
        (l.cnpj ?? '').toLowerCase().includes(term) ||
        (l.cidade ?? '').toLowerCase().includes(term)
      const matchV = !fVendedor || l.vendedor_responsavel_id === fVendedor
      const matchS = !fStatus || l.status === fStatus
      return matchTerm && matchV && matchS
    })
  }, [minhasLojas, search, fVendedor, fStatus])

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

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Pesquisar por nome, CNPJ ou cidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && <Select value={fVendedor || 'todos'} onValueChange={(value) => setFVendedor(value === 'todos' ? '' : value)}>
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Vendedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {vendedores.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>}
        <Select value={fStatus || 'todos'} onValueChange={(value) => setFStatus(value === 'todos' ? '' : value)}>
          <SelectTrigger className="sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Store className="h-8 w-8" />}
          title="Nenhuma loja encontrada"
          description="Cadastre uma nova loja ou ajuste os filtros."
          action={
            <Button variant="accent" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Nova loja
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filtered.map((l) => (
            <Card key={l.id} className="bg-white transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
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
                  <StatusBadge value={l.status} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Vendedor: {l.vendedor?.nome ?? '-'}
                </p>
                {isAdmin && <p className="text-xs text-muted-foreground">Cadastrada por: {l.criador?.nome ?? '-'}</p>}
                <p className="text-xs text-muted-foreground">{contatosDaLoja(l.id)} contato(s)</p>
                <div className="mt-3 flex gap-2">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link to={`/lojas/${l.id}`}>Detalhes</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="accent"
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
