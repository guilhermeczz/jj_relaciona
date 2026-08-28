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
import type { Campanha } from '@/types'

const STATUS = ['rascunho', 'ativa', 'encerrada', 'cancelada']

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  campanha?: Campanha | null
}

export function CampanhaDialog({ open, onOpenChange, campanha }: Props) {
  const { loadAll } = useData()
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    produto_marca: '',
    regra: '',
    premio: '',
    data_inicio: '',
    data_fim: '',
    status: 'rascunho',
    observacoes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (campanha) {
        setForm({
          nome: campanha.nome,
          descricao: campanha.descricao ?? '',
          produto_marca: campanha.produto_marca ?? '',
          regra: campanha.regra ?? '',
          premio: campanha.premio ?? '',
          data_inicio: campanha.data_inicio ?? '',
          data_fim: campanha.data_fim ?? '',
          status: campanha.status,
          observacoes: campanha.observacoes ?? '',
        })
      } else {
        setForm({
          nome: '',
          descricao: '',
          produto_marca: '',
          regra: '',
          premio: '',
          data_inicio: '',
          data_fim: '',
          status: 'rascunho',
          observacoes: '',
        })
      }
    }
  }, [open, campanha])

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.nome.trim()) {
      toast.error('Informe o nome da campanha')
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      nome: form.nome.trim(),
    }
    const { error } = campanha
      ? await supabase.from('campanhas').update(payload).eq('id', campanha.id)
      : await supabase.from('campanhas').insert(payload)
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(campanha ? 'Campanha atualizada' : 'Campanha criada')
    onOpenChange(false)
    loadAll()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{campanha ? 'Editar campanha' : 'Nova campanha'}</DialogTitle>
          <DialogDescription>Configure a campanha comercial.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Nome da campanha</Label>
            <Input value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex: Venda 10 e ganhe R$ 50" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={(e) => set('descricao', e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Produto / Marca</Label>
            <Input value={form.produto_marca} onChange={(e) => set('produto_marca', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Regra</Label>
            <Input value={form.regra} onChange={(e) => set('regra', e.target.value)} placeholder="Ex: 10 unidades do produto X" />
          </div>
          <div className="space-y-1.5">
            <Label>Prêmio</Label>
            <Input value={form.premio} onChange={(e) => set('premio', e.target.value)} placeholder="Ex: R$ 50,00" />
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
          <div className="space-y-1.5">
            <Label>Data inicial</Label>
            <Input type="date" value={form.data_inicio} onChange={(e) => set('data_inicio', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Data final</Label>
            <Input type="date" value={form.data_fim} onChange={(e) => set('data_fim', e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={2} />
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
