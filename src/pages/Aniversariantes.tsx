import { useMemo, useState } from 'react'
import { Cake, MessageCircle, Gift, MessageSquare } from 'lucide-react'
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
import { WhatsAppDialog } from '@/components/whatsapp-dialog'
import { BrindeDialog } from '@/components/brinde-dialog'
import { InteracaoDialog } from '@/components/interacao-dialog'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { formatDataBR, filterAniversariantes, type Aniversariante, type AniversarioFiltro } from '@/lib/aniversario'
import { MSG_LOJA_ANIVERSARIO, MSG_CONTATO_ANIVERSARIO } from '@/lib/whatsapp'

export function Aniversariantes() {
  const { lojas, contatos, profiles } = useData()
  const { user, isAdmin } = useAuth()
  const [filtro, setFiltro] = useState<AniversarioFiltro>('30dias')
  const [fVendedor, setFVendedor] = useState('')
  const [fCidade, setFCidade] = useState('')
  const [fTipo, setFTipo] = useState('')
  const [wa, setWa] = useState<{ phone: string; message: string } | null>(null)
  const [brindeTarget, setBrindeTarget] = useState<{ lojaId: string; contatoId?: string } | null>(null)
  const [interacaoTarget, setInteracaoTarget] = useState<{ lojaId: string; contatoId?: string } | null>(null)

  const vendedores = profiles.filter((p) => p.perfil === 'vendedor')

  const minhasLojas = useMemo(
    () => (isAdmin ? lojas : lojas.filter((l) => l.vendedor_responsavel_id === user?.id)),
    [lojas, isAdmin, user],
  )

  const lista: Aniversariante[] = useMemo(() => {
    const out: Aniversariante[] = []
    for (const l of minhasLojas) {
      if (l.data_fundacao) {
        const d = new Date(l.data_fundacao)
        out.push({
          tipo: 'loja',
          nome: l.nome_fantasia,
          data: l.data_fundacao,
          mes: d.getMonth() + 1,
          dia: d.getDate(),
          lojaId: l.id,
          lojaNome: l.nome_fantasia,
          contatoId: undefined,
          telefone: l.whatsapp || l.telefone,
          vendedorNome: l.vendedor?.nome,
          vendedorId: l.vendedor_responsavel_id ?? undefined,
        })
      }
      for (const c of contatos.filter((c) => c.loja_id === l.id && c.ativo)) {
        if (c.data_nascimento) {
          const d = new Date(c.data_nascimento)
          out.push({
            tipo: 'contato',
            nome: c.nome,
            data: c.data_nascimento,
            mes: d.getMonth() + 1,
            dia: d.getDate(),
            contatoId: c.id,
            lojaId: l.id,
            lojaNome: l.nome_fantasia,
            telefone: c.whatsapp || c.telefone,
            vendedorNome: l.vendedor?.nome,
            vendedorId: l.vendedor_responsavel_id ?? undefined,
          })
        }
      }
    }
    return out
  }, [minhasLojas, contatos])

  const cidades = useMemo(
    () => [...new Set(minhasLojas.map((l) => l.cidade).filter((c): c is string => Boolean(c)))],
    [minhasLojas],
  )

  const filtrados = filterAniversariantes(lista, filtro).filter((a) => {
    const matchV = !fVendedor || a.vendedorId === fVendedor
    const matchC = !fCidade || a.lojaNome === minhasLojas.find((l) => l.id === a.lojaId)?.cidade
    const matchT = !fTipo || a.tipo === fTipo
    return matchV && matchC && matchT
  })

  const lojaCidade = (lojaId?: string) => minhasLojas.find((l) => l.id === lojaId)?.cidade ?? '-'

  return (
    <div>
      <PageHeader title="Aniversariantes" description="Aniversários de lojas e contatos." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Select value={filtro} onValueChange={(v) => setFiltro(v as AniversarioFiltro)}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="7dias">Próximos 7 dias</SelectItem>
            <SelectItem value="30dias">Próximos 30 dias</SelectItem>
            <SelectItem value="mes">Mês atual</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
        {isAdmin && (
          <Select value={fVendedor} onValueChange={setFVendedor}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="Vendedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {vendedores.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={fCidade} onValueChange={setFCidade}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {cidades.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fTipo} onValueChange={setFTipo}>
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="loja">Loja</SelectItem>
            <SelectItem value="contato">Contato</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtrados.length === 0 ? (
        <EmptyState icon={<Cake className="h-8 w-8" />} title="Nenhum aniversariante no período selecionado" />
      ) : (
        <div className="space-y-3">
          {filtrados.map((a, i) => (
            <Card key={i} className="bg-white">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-brand-black">{a.nome}</span>
                    <StatusBadge value={a.tipo === 'loja' ? 'loja' : 'contato'} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDataBR(a.data)} · {a.lojaNome} · {lojaCidade(a.lojaId)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vendedor: {a.vendedorNome ?? '-'} · Tel: {a.telefone ?? '-'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() =>
                      setWa({
                        phone: a.telefone ?? '',
                        message: a.tipo === 'loja' ? MSG_LOJA_ANIVERSARIO : MSG_CONTATO_ANIVERSARIO,
                      })
                    }
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBrindeTarget({ lojaId: a.lojaId ?? '', contatoId: a.contatoId })}
                  >
                    <Gift className="h-4 w-4" /> Brinde
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setInteracaoTarget({ lojaId: a.lojaId ?? '', contatoId: a.contatoId })}
                  >
                    <MessageSquare className="h-4 w-4" /> Interação
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <WhatsAppDialog
        open={!!wa}
        onOpenChange={(o) => !o && setWa(null)}
        phone={wa?.phone}
        defaultMessage={wa?.message ?? ''}
      />
      <BrindeDialog
        open={!!brindeTarget}
        onOpenChange={(o) => !o && setBrindeTarget(null)}
        lojaId={brindeTarget?.lojaId}
        contatoId={brindeTarget?.contatoId}
      />
      <InteracaoDialog
        open={!!interacaoTarget}
        onOpenChange={(o) => !o && setInteracaoTarget(null)}
        lojaId={interacaoTarget?.lojaId ?? ''}
        contatoId={interacaoTarget?.contatoId}
        usuarioId={user?.id ?? ''}
        contatos={[]}
      />
    </div>
  )
}
