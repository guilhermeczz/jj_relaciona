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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  treinamento?: Treinamento | null
}

export function TreinamentoDialog({ open, onOpenChange, treinamento }: Props) {
  const { loadAll } = useData()
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
      }
    }
  }, [open, treinamento])

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.nome.trim()) {
      toast.error('Informe o nome do treinamento')
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
    const { error } = treinamento
      ? await supabase.from('treinamentos').update(payload).eq('id', treinamento.id)
      : await supabase.from('treinamentos').insert(payload)
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(treinamento ? 'Treinamento atualizado' : 'Treinamento criado')
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
