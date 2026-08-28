import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useData } from '@/context/DataContext'
import { Input } from '@/components/ui/input'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { exportCSV } from '@/lib/csv'
import type { Campanha, Treinamento } from '@/types'

type Tipo = 'campanha' | 'treinamento'

interface Props {
  tipo: Tipo
  open: boolean
  onOpenChange: (open: boolean) => void
  campanha?: Campanha | null
  treinamento?: Treinamento | null
}

export function ParParticipantesDialog({ tipo, open, onOpenChange, campanha, treinamento }: Props) {
  const { lojas, contatos, campanhaParticipantes, treinamentoParticipantes, loadAll } = useData()
  const [lojaId, setLojaId] = useState('')
  const [contatoId, setContatoId] = useState('')
  const [status, setStatus] = useState('convidado')
  const [saving, setSaving] = useState(false)

  const objetoId = tipo === 'campanha' ? campanha?.id : treinamento?.id

  const participantes = useMemo(
    () => (tipo === 'campanha' ? campanhaParticipantes : treinamentoParticipantes),
    [tipo, campanhaParticipantes, treinamentoParticipantes],
  )

  useEffect(() => {
    if (open) {
      setLojaId('')
      setContatoId('')
      setStatus('convidado')
    }
  }, [open])

  interface ParRow {
    id: string
    loja?: { nome_fantasia?: string; whatsapp?: string | null; telefone?: string | null } | null
    contato?: { nome?: string; whatsapp?: string | null; telefone?: string | null } | null
    status?: string | null
    confirmado?: boolean
    compareceu?: boolean
    campanha_id?: string
    treinamento_id?: string
  }

  const meusParticipantes = participantes.filter(
    (p) =>
      ('campanha_id' in p && p.campanha_id === objetoId) ||
      ('treinamento_id' in p && p.treinamento_id === objetoId),
  ) as unknown as ParRow[]
  const contatosDaLoja = lojaId ? contatos.filter((c) => c.loja_id === lojaId && c.ativo) : []

  async function addParticipante() {
    if (!lojaId) {
      toast.error('Selecione uma loja')
      return
    }
    setSaving(true)
    const table = tipo === 'campanha' ? 'campanha_participantes' : 'treinamento_participantes'
    const idKey = tipo === 'campanha' ? 'campanha_id' : 'treinamento_id'
    const payload: Record<string, unknown> = {
      [idKey]: objetoId,
      loja_id: lojaId,
      contato_id: contatoId || null,
      status,
    }
    const { error } = await supabase.from(table).insert(payload)
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Participante adicionado')
    setContatoId('')
    loadAll()
  }

  async function atualizarParticipante(id: string, campo: string, valor: unknown) {
    const table = tipo === 'campanha' ? 'campanha_participantes' : 'treinamento_participantes'
    const { error } = await supabase.from(table).update({ [campo]: valor }).eq('id', id)
    if (error) toast.error(error.message)
    else loadAll()
  }

  async function removerParticipante(id: string) {
    const table = tipo === 'campanha' ? 'campanha_participantes' : 'treinamento_participantes'
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Participante removido')
      loadAll()
    }
  }

  const titulo = tipo === 'campanha' ? campanha?.nome : treinamento?.nome

  function conviteMessage(p: (typeof meusParticipantes)[number]) {
    const nome = p.contato?.nome ?? p.loja?.nome_fantasia ?? 'loja'
    if (tipo === 'campanha') {
      return `Olá, ${nome}! Convidamos sua loja para participar da campanha "${titulo}". ${campanha?.regra ? 'Regra: ' + campanha.regra + '.' : ''} ${campanha?.premio ? 'Prêmio: ' + campanha.premio + '.' : ''}`
    }
    const t = treinamento
    return `Olá, ${nome}! Convidamos você para o treinamento "${titulo}"${t?.data ? ' no dia ' + formatData(t.data) : ''}${t?.horario ? ' às ' + t.horario.slice(0, 5) : ''}${t?.local ? ', em ' + t.local : ''}. Confirma sua presença?`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Participantes · {titulo ?? '-'}</DialogTitle>
          <DialogDescription>
            Adicione lojas e contatos como participantes.
          </DialogDescription>
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => exportarParticipantes(meusParticipantes, exportCSV, titulo)}>
              Exportar CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => convidarTodos(meusParticipantes, conviteMessage)}>
              Convidar por WhatsApp (todos)
            </Button>
          </div>
        </DialogHeader>

        <div className="rounded-lg border bg-brand-gray p-4">
          <p className="mb-3 text-sm font-medium text-brand-black">Adicionar participante</p>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-1">
              <Select value={lojaId} onValueChange={(v) => { setLojaId(v); setContatoId('') }}>
                <SelectTrigger>
                  <SelectValue placeholder="Loja" />
                </SelectTrigger>
                <SelectContent>
                  {lojas.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.nome_fantasia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-1">
              <Select value={contatoId} onValueChange={setContatoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Contato (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {contatosDaLoja.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-1">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="convidado">Convidado</SelectItem>
                  <SelectItem value="participando">Participando</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button variant="accent" className="w-full" onClick={addParticipante} disabled={saving}>
                Adicionar
              </Button>
            </div>
          </div>
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto">
          {meusParticipantes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum participante ainda.</p>
          ) : (
            meusParticipantes.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="font-medium text-brand-black">
                    {p.loja?.nome_fantasia}
                    {p.contato ? ` · ${p.contato.nome}` : ''}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {tipo === 'treinamento' ? (
                      <>
                        <label className="flex items-center gap-1 text-xs">
                          <Input
                            type="checkbox"
                            className="h-3.5 w-3.5"
                            checked={p.confirmado}
                            onChange={(e) => atualizarParticipante(p.id, 'confirmado', e.target.checked)}
                          />
                          Confirmado
                        </label>
                        <label className="flex items-center gap-1 text-xs">
                          <Input
                            type="checkbox"
                            className="h-3.5 w-3.5"
                            checked={p.compareceu}
                            onChange={(e) => atualizarParticipante(p.id, 'compareceu', e.target.checked)}
                          />
                          Compareceu
                        </label>
                      </>
                    ) : (
                      <Select
                        value={p.status ?? undefined}
                        onValueChange={(v) => atualizarParticipante(p.id, 'status', v)}
                      >
                        <SelectTrigger className="h-7 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="convidado">Convidado</SelectItem>
                          <SelectItem value="participando">Participando</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    size="sm"
                    variant="accent"
                    title="Convidar por WhatsApp"
                    onClick={() => {
                      const phone = p.contato?.whatsapp ?? p.contato?.telefone ?? p.loja?.whatsapp ?? p.loja?.telefone
                      if (!phone) {
                        alert('Sem WhatsApp cadastrado para este participante.')
                        return
                      }
                      window.open(buildWhatsAppLink(phone, conviteMessage(p)), '_blank', 'noopener')
                    }}
                  >
                    WhatsApp
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removerParticipante(p.id)}>
                    Remover
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatData(data?: string | null): string {
  if (!data) return ''
  const d = new Date(data)
  return d.toLocaleDateString('pt-BR')
}

function exportarParticipantes(
  lista: { loja?: { nome_fantasia?: string } | null; contato?: { nome?: string } | null; status?: string | null; confirmado?: boolean; compareceu?: boolean }[],
  _export: typeof exportCSV,
  titulo?: string,
) {
  const rows = lista.map((p) => ({
    Loja: p.loja?.nome_fantasia ?? '-',
    Contato: p.contato?.nome ?? '-',
    Status: p.status ?? (p.confirmado ? 'confirmado' : ''),
    Compareceu: p.compareceu ? 'Sim' : 'Não',
  }))
  const safe = (titulo ?? 'participantes').replace(/[^a-zA-Z0-9]/g, '_')
  _export(rows, `participantes_${safe}.csv`)
}

function convidarTodos(
  lista: { contato?: { whatsapp?: string | null; telefone?: string | null; nome?: string } | null; loja?: { whatsapp?: string | null; telefone?: string | null; nome_fantasia?: string } | null }[],
  messageFn: (p: any) => string,
) {
  const comTelefone = lista.filter((p) => p.contato?.whatsapp || p.contato?.telefone || p.loja?.whatsapp || p.loja?.telefone)
  if (comTelefone.length === 0) {
    alert('Nenhum participante possui WhatsApp cadastrado.')
    return
  }
  const primeiro = comTelefone[0]
  const phone = primeiro.contato?.whatsapp ?? primeiro.contato?.telefone ?? primeiro.loja?.whatsapp ?? primeiro.loja?.telefone ?? ''
  window.open(buildWhatsAppLink(phone ?? '', messageFn(primeiro)), '_blank', 'noopener')
}
