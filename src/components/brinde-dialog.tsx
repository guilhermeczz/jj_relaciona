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
import type { Brinde, Loja } from '@/types'

const MOTIVOS = ['aniversario_loja', 'aniversario_contato', 'campanha', 'relacionamento', 'outro']
const STATUS = ['pendente', 'separado', 'enviado', 'cancelado']

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  lojaId?: string
  contatoId?: string | null
  brinde?: Brinde | null
}

export function BrindeDialog({ open, onOpenChange, lojaId, contatoId, brinde }: Props) {
  const { lojas, loadAll, getContatosDaLoja } = useData()
  const [loja, setLoja] = useState(lojaId ?? '')
  const [contato, setContato] = useState(contatoId ?? '')
  const [motivo, setMotivo] = useState('relacionamento')
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
        setMotivo(brinde.motivo ?? 'relacionamento')
        setDescricao(brinde.descricao ?? '')
        setStatus(brinde.status)
        setDataPrevista(brinde.data_prevista ?? '')
        setDataEnvio(brinde.data_envio ?? '')
        setObservacoes(brinde.observacoes ?? '')
      } else {
        setLoja(lojaId ?? lojas[0]?.id ?? '')
        setContato(contatoId ?? '')
        setMotivo('relacionamento')
        setDescricao('')
        setStatus('pendente')
        setDataPrevista('')
        setDataEnvio('')
        setObservacoes('')
      }
    }
  }, [open, brinde, lojaId, contatoId, lojas])

  const contatosDaLoja = loja ? getContatosDaLoja(loja) : []

  async function handleSubmit() {
    if (!loja || !descricao.trim()) {
      toast.error('Informe a loja e a descrição do brinde')
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
            <Label>Loja</Label>
            <Select value={loja} onValueChange={setLoja}>
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
            <Select value={contato} onValueChange={setContato}>
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
          </div>
          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m.replace('_', ' ')}
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
                  <SelectItem key={s} value={s}>
                    {s}
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
            <Label>Descrição do brinde</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Caneca personalizada" />
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
