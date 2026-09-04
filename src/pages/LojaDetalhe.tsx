import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, MessageCircle, Users, MapPin, Plus, Cake, Gift, Power } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge, CargoTraducao } from '@/components/status-badge'
import { NotFound } from '@/pages/NotFound'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import { LojaDialog } from '@/components/loja-dialog'
import { ContatoDialog } from '@/components/contato-dialog'
import { InteracaoDialog } from '@/components/interacao-dialog'
import { WhatsAppDialog } from '@/components/whatsapp-dialog'
import { formatDataBR } from '@/lib/aniversario'
import { EmptyState } from '@/components/empty-state'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function LojaDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getLoja, getContatosDaLoja, interacoes, brindes, treinamentoParticipantes, treinamentos, loadAll } = useData()
  const { user, isAdmin } = useAuth()
  const [tab, setTab] = useState('dados')
  const [editOpen, setEditOpen] = useState(false)
  const [contatoOpen, setContatoOpen] = useState(false)
  const [interacaoOpen, setInteracaoOpen] = useState(false)
  const [wa, setWa] = useState<{ phone: string; message: string } | null>(null)

  const loja = getLoja(id ?? '')
  const lojaContatos = loja ? getContatosDaLoja(loja.id) : []
  const lojaInteracoes = interacoes.filter((i) => i.loja_id === id)
  const lojaBrindes = brindes.filter((b) => b.loja_id === id)
  const lojaTreinamentos = treinamentoParticipantes.filter((t) => t.loja_id === id)

  const data = useMemo(() => {
    if (!loja) return null
    return [
      { label: 'Razão social', value: loja.razao_social ?? '-' },
      { label: 'CNPJ', value: loja.cnpj ?? '-' },
      { label: 'Data de fundação', value: formatDataBR(loja.data_fundacao) },
      { label: 'Segmento', value: loja.segmento ?? '-' },
      { label: 'Vendedor responsável', value: loja.vendedor?.nome ?? '-' },
      { label: 'Status', value: loja.status },
      { label: 'WhatsApp', value: loja.whatsapp ?? '-' },
      { label: 'Telefone', value: loja.telefone ?? '-' },
      { label: 'E-mail', value: loja.email ?? '-' },
      { label: 'Endereço', value: `${loja.endereco ?? ''}, ${loja.numero ?? ''} - ${loja.bairro ?? ''}` },
      { label: 'Cidade/UF', value: `${loja.cidade ?? ''} - ${loja.estado ?? ''}` },
      { label: 'CEP', value: loja.cep ?? '-' },
    ]
  }, [loja])

  if (!loja) {
    return (
      <div>
        <Link to="/lojas" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar para lojas
        </Link>
        <NotFound />
      </div>
    )
  }

  async function inativar() {
    if (!loja) return
    const novo = loja.status === 'ativo' ? 'inativo' : 'ativo'
    const { error } = await supabase.from('lojas').update({ status: novo }).eq('id', loja.id)
    if (error) toast.error(error.message)
    else {
      toast.success(`Loja ${novo === 'ativo' ? 'ativada' : 'inativada'}`)
      await loadAll()
      navigate(novo === 'ativo' ? '/lojas' : '/lojas?aba=inativas')
    }
  }

  return (
    <div>
      <Link to="/lojas" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar para lojas
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-brand-black">{loja.nome_fantasia}</h1>
            <StatusBadge value={loja.status} />
          </div>
          {loja.cidade && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {loja.cidade}{loja.estado ? ` - ${loja.estado}` : ''}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="accent" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Editar
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setWa({
                phone: loja.whatsapp ?? '',
                message: `Olá, ${loja.nome_fantasia}! Tudo bem? Somos da equipe JJ/ConstruJota.`,
              })
            }
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </Button>
          {isAdmin && (
            <Button
              size="icon"
              variant={loja.status === 'ativo' ? 'destructive' : 'outline'}
              onClick={inativar}
              title={loja.status === 'ativo' ? 'Inativar loja' : 'Reativar loja'}
              aria-label={loja.status === 'ativo' ? 'Inativar loja' : 'Reativar loja'}
            >
              <Power className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="flex-wrap h-auto w-full justify-start rounded-lg">
          <TabsTrigger value="dados">Dados da loja</TabsTrigger>
          <TabsTrigger value="contatos">Contatos ({lojaContatos.length})</TabsTrigger>
          <TabsTrigger value="interacoes">Interações</TabsTrigger>
          {isAdmin && <TabsTrigger value="brindes">Brindes</TabsTrigger>}
          {isAdmin && <TabsTrigger value="treinamentos">Treinamentos</TabsTrigger>}
        </TabsList>

        <TabsContent value="dados" className="mt-4">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                {data?.map((d) => (
                  <div key={d.label} className={d.label === 'Endereço' || d.label === 'Observações' ? 'sm:col-span-2' : ''}>
                    <p className="text-xs text-muted-foreground">{d.label}</p>
                    <p className="font-medium text-brand-black">{d.value}</p>
                  </div>
                ))}
              </div>
              {loja.observacoes && (
                <div className="mt-5 rounded-lg bg-brand-gray p-4">
                  <p className="text-xs text-muted-foreground">Observações</p>
                  <p className="mt-1 text-sm">{loja.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contatos" className="mt-4">
          <div className="mb-3 flex justify-end">
            <Button variant="accent" onClick={() => setContatoOpen(true)}>
              <Plus className="h-4 w-4" /> Novo contato
            </Button>
          </div>
          {lojaContatos.length === 0 ? (
            <EmptyState icon={<Users className="h-8 w-8" />} title="Nenhum contato cadastrado" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {lojaContatos.map((c) => (
                <Card key={c.id} className="bg-white">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="min-w-0">
                      <p className="font-medium text-brand-black">{c.nome}</p>
                      <p className="text-xs text-muted-foreground">{CargoTraducao(c.cargo)}</p>
                      <p className="mt-1 text-xs">{c.whatsapp ?? c.email ?? '-'}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Hobby: {c.hobby ?? '-'}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="accent"
                      onClick={() =>
                        setWa({
                          phone: c.whatsapp ?? '',
                          message: `Olá, ${c.nome}! Tudo bem? Somos da equipe JJ/ConstruJota.`,
                        })
                      }
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="interacoes" className="mt-4">
          <div className="mb-3 flex justify-end">
            <Button onClick={() => setInteracaoOpen(true)}>
              <Plus className="h-4 w-4" /> Registrar interação
            </Button>
          </div>
          {lojaInteracoes.length === 0 ? (
            <EmptyState icon={<MessageCircle className="h-8 w-8" />} title="Nenhuma interação registrada" />
          ) : (
            <div className="space-y-3">
              {lojaInteracoes.map((i) => (
                <Card key={i.id} className="bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-brand-black">{i.tipo}</p>
                      <span className="text-xs text-muted-foreground">{formatDataBR(i.data_interacao)}</span>
                    </div>
                    <p className="mt-2 text-sm">{i.descricao}</p>
                    {i.contato && <p className="mt-2 text-xs text-muted-foreground">Contato: {i.contato.nome}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {isAdmin && <TabsContent value="brindes" className="mt-4">
          <div className="mb-3 flex justify-end">
            <Button
              variant="accent"
              asChild
            >
              <Link to={`/brindes?nova=${loja.id}`}><Plus className="h-4 w-4" /> Novo brinde</Link>
            </Button>
          </div>
          {lojaBrindes.length === 0 ? (
            <EmptyState icon={<Gift className="h-8 w-8" />} title="Nenhum brinde para esta loja" />
          ) : (
            <div className="space-y-3">
              {lojaBrindes.map((b) => (
                <Card key={b.id} className="bg-white">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-brand-black">{b.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.motivo?.replace('_', ' ')} · prev. {formatDataBR(b.data_prevista)}
                        {b.contato ? ` · ${b.contato.nome}` : ''}
                      </p>
                    </div>
                    <StatusBadge value={b.status} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>}

        {isAdmin && <TabsContent value="treinamentos" className="mt-4">
          {lojaTreinamentos.length === 0 ? (
            <EmptyState icon={<Cake className="h-8 w-8" />} title="Loja não participa de treinamentos" />
          ) : (
            <div className="space-y-3">
              {lojaTreinamentos.map((t) => {
                const treino = treinamentos.find((x) => x.id === t.treinamento_id)
                return (
                  <Card key={t.id} className="bg-white">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-brand-black">{treino?.nome ?? '-'}</p>
                        <p className="text-xs text-muted-foreground">
                          {treino ? `${formatDataBR(treino.data)} · ${treino.local ?? '-'}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {t.confirmado && <span className="text-emerald-600">Confirmado</span>}
                        {t.compareceu && <span className="text-emerald-600">Compareceu</span>}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>}
      </Tabs>

      <LojaDialog open={editOpen} onOpenChange={setEditOpen} loja={loja} />
      <ContatoDialog open={contatoOpen} onOpenChange={setContatoOpen} lojaId={loja.id} />
      <InteracaoDialog
        open={interacaoOpen}
        onOpenChange={setInteracaoOpen}
        lojaId={loja.id}
        usuarioId={user?.id ?? ''}
        contatos={lojaContatos.map((c) => ({ id: c.id, nome: c.nome }))}
      />
      <WhatsAppDialog
        open={!!wa}
        onOpenChange={(o) => !o && setWa(null)}
        phone={wa?.phone}
        defaultMessage={wa?.message ?? ''}
      />
    </div>
  )
}
