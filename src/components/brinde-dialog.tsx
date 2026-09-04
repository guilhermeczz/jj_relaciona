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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useData } from '@/context/DataContext'
import { useAuth } from '@/context/AuthContext'
import type { Brinde, Loja } from '@/types'

const MOTIVOS = [
  { value: 'aniversario_loja', label: 'Aniversário da loja' },
  { value: 'aniversario_contato', label: 'Aniversário do contato' },
  { value: 'relacionamento', label: 'Relacionamento' },
  { value: 'outro', label: 'Outro' },
]
const STATUS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'separado', label: 'Separado' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'cancelado', label: 'Cancelado' },
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  lojaId?: string
  contatoId?: string | null
  brinde?: Brinde | null
}

export function BrindeDialog({ open, onOpenChange, lojaId, contatoId, brinde }: Props) {
  const { lojas, loadAll, getContatosDaLoja } = useData()
  const { user, isAdmin } = useAuth()
  const [loja, setLoja] = useState(lojaId ?? '')
  const [contato, setContato] = useState(contatoId ?? '')
  const [motivo, setMotivo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [status, setStatus] = useState('pendente')
  const [dataPrevista, setDataPrevista] = useState('')
  const [dataEnvio, setDataEnvio] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (brinde) {
        setLoja(brinde.loja_id)
        setContato(brinde.contato_id ?? '')
        setMotivo(brinde.motivo ?? '')
        setDescricao(brinde.descricao ?? '')
        setStatus(brinde.status)
        setDataPrevista(brinde.data_prevista ?? '')
        setDataEnvio(brinde.data_envio ?? '')
        setObservacoes(brinde.observacoes ?? '')
      } else {
        setLoja(lojaId ?? lojas[0]?.id ?? '')
        setContato(contatoId ?? '')
        setMotivo('')
        setDescricao('')
        setStatus('pendente')
        setDataPrevista('')
        setDataEnvio('')
        setObservacoes('')
      }
    }
  }, [open, brinde, lojaId, contatoId, lojas])

  const contatosDaLoja = loja ? getContatosDaLoja(loja) : []
  const contatoSelecionado = contatosDaLoja.find((item) => item.id === contato)

  async function handleSubmit() {
    if (!loja) {
      toast.error('Selecione a loja.')
      return
    }
    if (!motivo) {
      toast.error('Selecione o motivo do brinde.')
      return
    }
    if (!descricao.trim()) {
      toast.error('Informe a descrição do brinde.')
      return
    }
    setSaving(true)
    const payload = {
      loja_id: loja,
      contato_id: contato || null,
      motivo,
      descricao: descricao.trim(),
      status,
      data_prevista: dataPrevista || null,
      data_envio: status === 'enviado' && dataEnvio ? dataEnvio : dataEnvio || null,
      vendedor_responsavel_id: brinde?.vendedor_responsavel_id ?? (isAdmin ? lojas.find((item) => item.id === loja)?.vendedor_responsavel_id : user?.id) ?? null,
      observacoes: observacoes || null,
    }
    const { error } = brinde
      ? await supabase.from('brindes').update(payload).eq('id', brinde.id)
      : await supabase.from('brindes').insert(payload)
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(brinde ? 'Brinde atualizado' : 'Brinde criado')
    onOpenChange(false)
    loadAll()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{brinde ? 'Editar brinde' : 'Novo brinde'}</DialogTitle>
          <DialogDescription>Controle os brindes oferecidos às lojas e contatos.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Loja *</Label>
            <Select value={loja} onValueChange={(value) => { setLoja(value); setContato('') }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a loja" />
              </SelectTrigger>
              <SelectContent>
                {lojas.map((l: Loja) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.nome_fantasia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Contato (opcional)</Label>
            <Select value={contato || 'none'} onValueChange={(value) => setContato(value === 'none' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um contato" />
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
            {contatoSelecionado && (
              <p className="rounded-md bg-brand-gray px-3 py-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Hobby:</span> {contatoSelecionado.hobby ?? 'Não informado'}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Motivo *</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger aria-required="true">
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Data prevista</Label>
            <Input type="date" value={dataPrevista} onChange={(e) => setDataPrevista(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Data de envio</Label>
            <Input type="date" value={dataEnvio} onChange={(e) => setDataEnvio(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Descrição do brinde *</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: caneca personalizada" required />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} />
          </div>
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
