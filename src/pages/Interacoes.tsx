import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Download } from 'lucide-react'
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
import { EmptyState } from '@/components/empty-state'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { formatDataBR } from '@/lib/aniversario'
import { exportCSV } from '@/lib/csv'

export function Interacoes() {
  const { interacoes, lojas, profiles } = useData()
  const { isAdmin, user } = useAuth()
  const [search, setSearch] = useState('')
  const [fTipo, setFTipo] = useState('')

  const tipos = useMemo(() => [...new Set(interacoes.map((i) => i.tipo))], [interacoes])

  const minhasLojas = useMemo(
    () => (isAdmin ? lojas : lojas.filter((l) => l.vendedor_responsavel_id === user?.id)),
    [lojas, isAdmin, user],
  )
  const lojaIds = new Set(minhasLojas.map((l) => l.id))
  const visiveis = interacoes.filter((i) => lojaIds.has(i.loja_id))

  const filtered = useMemo(() => {
    const term = search.toLowerCase()
    return visiveis.filter((i) => {
      const matchTerm =
        !term ||
        (i.loja?.nome_fantasia ?? '').toLowerCase().includes(term) ||
        (i.contato?.nome ?? '').toLowerCase().includes(term) ||
        i.descricao.toLowerCase().includes(term)
      const matchT = !fTipo || i.tipo === fTipo
      return matchTerm && matchT
    })
  }, [visiveis, search, fTipo])

  const nomeUsuario = (id: string) => profiles.find((p) => p.id === id)?.nome ?? '-'

  function exportar() {
    const rows = filtered.map((i) => ({
      Loja: i.loja?.nome_fantasia ?? '-',
      Contato: i.contato?.nome ?? '-',
      Tipo: i.tipo,
      Descricao: i.descricao,
      Data: formatDataBR(i.data_interacao),
      Responsavel: nomeUsuario(i.usuario_id),
    }))
    exportCSV(rows, 'interacoes.csv')
  }

  return (
    <div>
      <PageHeader
        title="Interações"
        description="Histórico de relacionamento com as lojas."
        actions={
          <Button variant="outline" onClick={exportar}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Input
            placeholder="Pesquisar por loja, contato ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={fTipo || 'todos'} onValueChange={(value) => setFTipo(value === 'todos' ? '' : value)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {tipos.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<MessageSquare className="h-8 w-8" />} title="Nenhuma interação encontrada" />
      ) : (
        <div className="space-y-3">
          {filtered.map((i) => (
            <Card key={i.id} className="bg-white">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-brand-black">
                      {i.tipo}
                    </span>
                    <Link to={`/lojas/${i.loja_id}`} className="text-sm text-muted-foreground hover:underline">
                      {i.loja?.nome_fantasia}
                    </Link>
                    {i.contato && <span className="text-sm text-muted-foreground">· {i.contato.nome}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDataBR(i.data_interacao)}</span>
                </div>
                <p className="mt-2 text-sm">{i.descricao}</p>
                <p className="mt-2 text-xs text-muted-foreground">Responsável: {nomeUsuario(i.usuario_id)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
