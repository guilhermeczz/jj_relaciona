import { useMemo } from 'react'
import { Download, BarChart3 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/empty-state'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { formatDataBR, isThisMonth, type Aniversariante } from '@/lib/aniversario'
import { exportCSV } from '@/lib/csv'

export function Relatorios() {
  const { lojas, contatos, treinamentos, treinamentoParticipantes, brindes, profiles } = useData()
  const { isAdmin, user } = useAuth()

  const vendedores = profiles.filter((p) => p.perfil === 'vendedor')

  const minhasLojas = useMemo(
    () => (isAdmin ? lojas : lojas.filter((l) => l.vendedor_responsavel_id === user?.id)),
    [lojas, isAdmin, user],
  )
  const lojaIds = new Set(minhasLojas.map((l) => l.id))
  const visiveisContatos = contatos.filter((c) => lojaIds.has(c.loja_id))

  const aniversariantesMes: Aniversariante[] = useMemo(() => {
    const out: Aniversariante[] = []
    for (const l of minhasLojas) {
      if (l.data_fundacao) {
        const d = new Date(l.data_fundacao)
        if (isThisMonth({ mes: d.getMonth() + 1, dia: d.getDate() } as Aniversariante))
          out.push({ tipo: 'loja', nome: l.nome_fantasia, data: l.data_fundacao, mes: d.getMonth() + 1, dia: d.getDate(), lojaNome: l.nome_fantasia, lojaId: l.id })
      }
      for (const c of visiveisContatos.filter((c) => c.loja_id === l.id && c.data_nascimento)) {
        const d = new Date(c.data_nascimento!)
        if (isThisMonth({ mes: d.getMonth() + 1, dia: d.getDate() } as Aniversariante))
          out.push({ tipo: 'contato', nome: c.nome, data: c.data_nascimento!, mes: d.getMonth() + 1, dia: d.getDate(), lojaId: l.id, lojaNome: l.nome_fantasia, contatoId: c.id })
      }
    }
    return out
  }, [minhasLojas, visiveisContatos])

  const lojasSemContato = useMemo(
    () => minhasLojas.filter((l) => !visiveisContatos.some((c) => c.loja_id === l.id && c.ativo && c.whatsapp)),
    [minhasLojas, visiveisContatos],
  )

  const relatorios = [
    {
      key: 'lojas-vendedor',
      label: 'Lojas por vendedor',
      data: () => {
        const rows = vendedores.map((v) => ({
          Vendedor: v.nome,
          'Qtd. lojas': minhasLojas.filter((l) => l.vendedor_responsavel_id === v.id).length,
        }))
        return { rows, filename: 'lojas_por_vendedor.csv', mostrar: true }
      },
    },
    {
      key: 'contatos-loja',
      label: 'Contatos por loja',
      data: () => ({
        rows: minhasLojas.map((l) => ({
          Loja: l.nome_fantasia,
          Contatos: visiveisContatos.filter((c) => c.loja_id === l.id && c.ativo).length,
        })),
        filename: 'contatos_por_loja.csv',
        mostrar: true,
      }),
    },
    {
      key: 'aniv-mes',
      label: 'Aniversariantes do mês',
      data: () => ({
        rows: aniversariantesMes.map((a) => ({
          Nome: a.nome,
          Tipo: a.tipo === 'loja' ? 'Loja' : 'Contato',
          'Data': formatDataBR(a.data),
          'Loja': a.lojaNome ?? '-',
        })),
        filename: 'aniversariantes_mes.csv',
        mostrar: true,
      }),
    },
    {
      key: 'brindes-pend',
      label: 'Brindes pendentes',
      data: () => ({
        rows: brindes
          .filter((b) => b.status === 'pendente' || b.status === 'separado')
          .map((b) => ({
            Loja: b.loja?.nome_fantasia ?? '-',
            Contato: b.contato?.nome ?? '-',
            Motivo: b.motivo?.replace('_', ' ') ?? '-',
            'Data prevista': formatDataBR(b.data_prevista),
          })),
        filename: 'brindes_pendentes.csv',
        mostrar: true,
      }),
    },
    {
      key: 'brindes-env',
      label: 'Brindes enviados',
      data: () => ({
        rows: brindes
          .filter((b) => b.status === 'enviado')
          .map((b) => ({
            Loja: b.loja?.nome_fantasia ?? '-',
            Contato: b.contato?.nome ?? '-',
            Motivo: b.motivo?.replace('_', ' ') ?? '-',
            'Data envio': formatDataBR(b.data_envio),
          })),
        filename: 'brindes_enviados.csv',
        mostrar: true,
      }),
    },
    {
      key: 'trein-program',
      label: 'Treinamentos programados',
      data: () => ({
        rows: treinamentos
          .filter((t) => t.status === 'programado')
          .map((t) => ({
            Nome: t.nome,
            Data: formatDataBR(t.data),
            Local: t.local ?? '-',
          })),
        filename: 'treinamentos_programados.csv',
        mostrar: isAdmin,
      }),
    },
    {
      key: 'trein-participantes',
      label: 'Participantes de treinamentos',
      data: () => ({
        rows: treinamentoParticipantes.map((p) => {
          const t = treinamentos.find((x) => x.id === p.treinamento_id)
          return {
            Treinamento: t?.nome ?? '-',
            Loja: p.loja?.nome_fantasia ?? '-',
            Contato: p.contato?.nome ?? '-',
            Confirmado: p.confirmado ? 'Sim' : 'Não',
            Compareceu: p.compareceu ? 'Sim' : 'Não',
          }
        }),
        filename: 'participantes_treinamentos.csv',
        mostrar: isAdmin,
      }),
    },
    {
      key: 'lojas-sem-contato',
      label: 'Lojas sem contato recente',
      data: () => ({
        rows: lojasSemContato.map((l) => ({
          Loja: l.nome_fantasia,
          Cidade: l.cidade ?? '-',
          Vendedor: l.vendedor?.nome ?? '-',
        })),
        filename: 'lojas_sem_contato.csv',
        mostrar: true,
      }),
    },
  ]

  return (
    <div>
      <PageHeader title="Relatórios" description="Visões gerenciais e exportação em CSV." />

      <Tabs defaultValue="lojas-vendedor" className="mt-2">
        <TabsList className="flex h-auto flex-wrap justify-start rounded-lg">
          {relatorios.map((r) => (
            <TabsTrigger key={r.key} value={r.key}>
              {r.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {relatorios.map((r) => (
          <TabsContent key={r.key} value={r.key} className="mt-4">
            <ReportCard
              key={r.key}
              title={r.label}
              rows={r.data().rows}
              filename={r.data().filename}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function ReportCard({ title, rows, filename }: { title: string; rows: Record<string, unknown>[]; filename: string }) {
  if (!rows.length) {
    return <EmptyState icon={<BarChart3 className="h-8 w-8" />} title="Sem dados para exibir" />
  }
  const headers = Object.keys(rows[0])
  return (
    <Card className="bg-white">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold text-brand-black">{title}</h3>
          <Button size="sm" variant="outline" onClick={() => exportCSV(rows, filename)}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-brand-gray">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-4 py-2 text-left font-medium text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                  {headers.map((h) => (
                    <td key={h} className="px-4 py-2">
                      {String(row[h] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
