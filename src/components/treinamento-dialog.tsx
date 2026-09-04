import { useEffect, useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useData } from '@/context/DataContext'
import type { Treinamento } from '@/types'

const STATUS = ['programado', 'realizado', 'cancelado']

type SelecaoConvite = {
  tipo: 'loja' | 'contatos'
  contatos: string[]
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  treinamento?: Treinamento | null
}

export function TreinamentoDialog({ open, onOpenChange, treinamento }: Props) {
  const { lojas, contatos, loadAll } = useData()
  const [form, setForm] = useState({
    nome: '',
    tema: '',
    parceiro: '',
    data: '',
    horario: '',
    local: '',
    vagas: '',
    descricao: '',
    status: 'programado',
  })
  const [saving, setSaving] = useState(false)
  const [convites, setConvites] = useState<Record<string, SelecaoConvite>>({})

  useEffect(() => {
    if (open) {
      if (treinamento) {
        setForm({
          nome: treinamento.nome,
          tema: treinamento.tema ?? '',
          parceiro: treinamento.parceiro ?? '',
          data: treinamento.data ?? '',
          horario: treinamento.horario ?? '',
          local: treinamento.local ?? '',
          vagas: treinamento.vagas?.toString() ?? '',
          descricao: treinamento.descricao ?? '',
          status: treinamento.status,
        })
      } else {
        setForm({
          nome: '',
          tema: '',
          parceiro: '',
          data: '',
          horario: '',
          local: '',
          vagas: '',
          descricao: '',
          status: 'programado',
        })
        setConvites({})
      }
    }
  }, [open, treinamento])

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function selecionarLoja(lojaId: string, selecionada: boolean) {
    setConvites((current) => {
      if (selecionada) return { ...current, [lojaId]: { tipo: 'loja', contatos: [] } }
      const next = { ...current }
      delete next[lojaId]
      return next
    })
  }

  function definirTipo(lojaId: string, tipo: SelecaoConvite['tipo']) {
    setConvites((current) => ({
      ...current,
      [lojaId]: { tipo, contatos: tipo === 'loja' ? [] : current[lojaId]?.contatos ?? [] },
    }))
  }

  function selecionarContato(lojaId: string, contatoId: string, selecionado: boolean) {
    setConvites((current) => {
      const selecionados = current[lojaId]?.contatos ?? []
      return {
        ...current,
        [lojaId]: {
          tipo: 'contatos',
          contatos: selecionado
            ? [...new Set([...selecionados, contatoId])]
            : selecionados.filter((id) => id !== contatoId),
        },
      }
    })
  }

  async function handleSubmit() {
    if (!form.nome.trim()) {
      toast.error('Informe o nome do treinamento')
      return
    }
    if (!treinamento && Object.keys(convites).length === 0) {
      toast.error('Selecione pelo menos uma loja para convidar')
      return
    }

    const selecaoIncompleta = Object.entries(convites).some(
      ([, selecao]) => selecao.tipo === 'contatos' && selecao.contatos.length === 0,
    )
    if (!treinamento && selecaoIncompleta) {
      toast.error('Selecione ao menos um contato nas lojas marcadas como contatos específicos')
      return
    }
    setSaving(true)
    const payload = {
      nome: form.nome.trim(),
      tema: form.tema || null,
      parceiro: form.parceiro || null,
      data: form.data || null,
      horario: form.horario || null,
      local: form.local || null,
      vagas: form.vagas ? Number(form.vagas) : null,
      descricao: form.descricao || null,
      status: form.status,
    }
    if (treinamento) {
      const { error } = await supabase.from('treinamentos').update(payload).eq('id', treinamento.id)
      setSaving(false)
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Treinamento atualizado')
      onOpenChange(false)
      loadAll()
      return
    }

    const { data: novoTreinamento, error } = await supabase
      .from('treinamentos')
      .insert(payload)
      .select('id')
      .single()

    if (error || !novoTreinamento) {
      setSaving(false)
      toast.error(error?.message ?? 'Não foi possível criar o treinamento')
      return
    }

    const participantes: Array<{ treinamento_id: string; loja_id: string; contato_id: string | null }> = []
    Object.entries(convites).forEach(([lojaId, selecao]) => {
      if (selecao.tipo === 'loja') {
        participantes.push({ treinamento_id: String(novoTreinamento.id), loja_id: lojaId, contato_id: null })
        return
      }
      selecao.contatos.forEach((contatoId) => {
        participantes.push({ treinamento_id: String(novoTreinamento.id), loja_id: lojaId, contato_id: contatoId })
      })
    })
    const { error: participantesError } = await supabase.from('treinamento_participantes').insert(participantes)
    setSaving(false)
    if (participantesError) {
      await supabase.from('treinamentos').delete().eq('id', novoTreinamento.id)
      toast.error(`Não foi possível incluir os convidados: ${participantesError.message}`)
      return
    }
    toast.success(`Treinamento criado com ${participantes.length} convite(s) preparado(s) para e-mail`)
    onOpenChange(false)
    loadAll()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{treinamento ? 'Editar treinamento' : 'Novo treinamento'}</DialogTitle>
          <DialogDescription>Configure o treinamento externo.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Nome</Label>
            <Input value={form.nome} onChange={(e) => set('nome', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Tema</Label>
            <Input value={form.tema} onChange={(e) => set('tema', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Fornecedor / Parceiro</Label>
            <Input value={form.parceiro} onChange={(e) => set('parceiro', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Data</Label>
            <Input type="date" value={form.data} onChange={(e) => set('data', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Horário</Label>
            <Input type="time" value={form.horario} onChange={(e) => set('horario', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Local</Label>
            <Input value={form.local} onChange={(e) => set('local', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Vagas</Label>
            <Input type="number" value={form.vagas} onChange={(e) => set('vagas', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={(e) => set('descricao', e.target.value)} rows={2} />
          </div>
          {!treinamento && (
            <div className="space-y-3 border-t pt-4 sm:col-span-2">
              <div>
                <Label>Quem será convidado *</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Marque as lojas e escolha entre o e-mail geral da loja ou contatos específicos.
                </p>
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border bg-brand-gray p-3">
                {lojas.map((loja) => {
                  const selecao = convites[loja.id]
                  const contatosDaLoja = contatos.filter((contato) => contato.loja_id === loja.id && contato.ativo)
                  return (
                    <div key={loja.id} className="rounded-lg border bg-white p-3">
                      <label className="flex cursor-pointer items-start gap-3">
                        <Checkbox
                          checked={Boolean(selecao)}
                          onCheckedChange={(value) => selecionarLoja(loja.id, Boolean(value))}
                          aria-label={`Selecionar ${loja.nome_fantasia}`}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-brand-black">{loja.nome_fantasia}</span>
                          <span className="block truncate text-xs text-muted-foreground">{loja.email || 'Loja sem e-mail cadastrado'}</span>
                        </span>
                      </label>

                      {selecao && (
                        <div className="ml-7 mt-3 space-y-3">
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant={selecao.tipo === 'loja' ? 'accent' : 'outline'} onClick={() => definirTipo(loja.id, 'loja')}>
                              Loja inteira
                            </Button>
                            <Button type="button" size="sm" variant={selecao.tipo === 'contatos' ? 'accent' : 'outline'} onClick={() => definirTipo(loja.id, 'contatos')} disabled={contatosDaLoja.length === 0}>
                              Alguns contatos
                            </Button>
                          </div>

                          {selecao.tipo === 'loja' && (
                            <p className="text-xs text-muted-foreground">O convite usará o e-mail geral da loja.</p>
                          )}
                          {selecao.tipo === 'contatos' && (
                            <div className="grid gap-2 sm:grid-cols-2">
                              {contatosDaLoja.map((contato) => (
                                <label key={contato.id} className="flex cursor-pointer items-start gap-2 rounded-md border p-2 text-xs">
                                  <Checkbox
                                    checked={selecao.contatos.includes(contato.id)}
                                    onCheckedChange={(value) => selecionarContato(loja.id, contato.id, Boolean(value))}
                                    aria-label={`Selecionar ${contato.nome}`}
                                  />
                                  <span className="min-w-0">
                                    <span className="block font-medium text-foreground">{contato.nome}</span>
                                    <span className="block truncate text-muted-foreground">{contato.email || 'Sem e-mail cadastrado'}</span>
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                {lojas.length === 0 && (
                  <p className="py-5 text-center text-sm text-muted-foreground">Cadastre uma loja antes de criar o treinamento.</p>
                )}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
