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
import type { Contato, Loja } from '@/types'

export const CARGOS = [
  'proprietario',
  'gerente',
  'comprador',
  'vendedor',
  'balconista',
  'financeiro',
  'outro',
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  lojaId?: string
  contato?: Contato | null
}

export function ContatoDialog({ open, onOpenChange, lojaId, contato }: Props) {
  const { lojas, loadAll } = useData()
  const [form, setForm] = useState({
    loja_id: '',
    nome: '',
    cargo: '',
    whatsapp: '',
    telefone: '',
    email: '',
    data_nascimento: '',
    recebe_mensagens: true,
    recebe_treinamentos: true,
    observacoes: '',
    ativo: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (contato) {
        setForm({
          loja_id: contato.loja_id,
          nome: contato.nome,
          cargo: contato.cargo ?? '',
          whatsapp: contato.whatsapp ?? '',
          telefone: contato.telefone ?? '',
          email: contato.email ?? '',
          data_nascimento: contato.data_nascimento ?? '',
          recebe_mensagens: contato.recebe_mensagens,
          recebe_treinamentos: contato.recebe_treinamentos,
          observacoes: contato.observacoes ?? '',
          ativo: contato.ativo,
        })
      } else {
        setForm({
          loja_id: lojaId ?? lojas[0]?.id ?? '',
          nome: '',
          cargo: '',
          whatsapp: '',
          telefone: '',
          email: '',
          data_nascimento: '',
          recebe_mensagens: true,
          recebe_treinamentos: true,
          observacoes: '',
          ativo: true,
        })
      }
    }
  }, [open, contato, lojaId, lojas])

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.loja_id || !form.nome.trim()) {
      toast.error('Informe a loja e o nome do contato')
      return
    }
    setSaving(true)
    const payload = {
      loja_id: form.loja_id,
      nome: form.nome.trim(),
      cargo: form.cargo || null,
      whatsapp: form.whatsapp || null,
      telefone: form.telefone || null,
      email: form.email || null,
      data_nascimento: form.data_nascimento || null,
      recebe_mensagens: form.recebe_mensagens,
      recebe_treinamentos: form.recebe_treinamentos,
      observacoes: form.observacoes || null,
      ativo: form.ativo,
    }
    const { error } = contato
      ? await supabase.from('contatos_loja').update(payload).eq('id', contato.id)
      : await supabase.from('contatos_loja').insert(payload)
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(contato ? 'Contato atualizado' : 'Contato criado')
    onOpenChange(false)
    loadAll()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{contato ? 'Editar contato' : 'Novo contato'}</DialogTitle>
          <DialogDescription>Cadastre os vendedores e representantes da loja cliente.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Loja vinculada</Label>
            <Select value={form.loja_id} onValueChange={(v) => set('loja_id', v)}>
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
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Nome</Label>
            <Input value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Nome do contato" />
          </div>
          <div className="space-y-1.5">
            <Label>Cargo / Função</Label>
            <Select value={form.cargo || 'none'} onValueChange={(v) => set('cargo', v === 'none' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {CARGOS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Data de nascimento</Label>
            <Input type="date" value={form.data_nascimento} onChange={(e) => set('data_nascimento', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp</Label>
            <Input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input value={form.telefone} onChange={(e) => set('telefone', e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>E-mail</Label>
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Autorizações (LGPD)</Label>
            <div className="flex flex-wrap gap-4 rounded-lg bg-brand-gray p-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.recebe_mensagens}
                  onCheckedChange={(v) => set('recebe_mensagens', Boolean(v))}
                />
                Recebe mensagens
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.recebe_treinamentos}
                  onCheckedChange={(v) => set('recebe_treinamentos', Boolean(v))}
                />
                Recebe convites de treinamento
              </label>
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={2} />
          </div>
          {contato && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.ativo ? 'ativo' : 'inativo'} onValueChange={(v) => set('ativo', v === 'ativo')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Utilize os dados cadastrados apenas para relacionamento comercial autorizado com a loja e seus
          representantes.
        </p>
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
