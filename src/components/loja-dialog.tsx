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
import { useAuth } from '@/context/AuthContext'
import type { Loja } from '@/types'

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

export const SEGMENTOS = [
  'Material de construção',
  'Materiais elétricos',
  'Materiais hidráulicos',
  'Acabamentos',
  'Ferramentas',
  'Pinturas',
  'Outro',
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  loja?: Loja | null
}

export function LojaDialog({ open, onOpenChange, loja }: Props) {
  const { profiles, loadAll } = useData()
  const { user, isAdmin } = useAuth()
  const vendedores = profiles.filter((p) => p.perfil === 'vendedor' && p.ativo)
  const [form, setForm] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    data_fundacao: '',
    whatsapp: '',
    telefone: '',
    email: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    segmento: '',
    vendedor_responsavel_id: '',
    status: 'ativo',
    observacoes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      if (loja) {
        setForm({
          razao_social: loja.razao_social ?? '',
          nome_fantasia: loja.nome_fantasia,
          cnpj: loja.cnpj ?? '',
          data_fundacao: loja.data_fundacao ?? '',
          whatsapp: loja.whatsapp ?? '',
          telefone: loja.telefone ?? '',
          email: loja.email ?? '',
          endereco: loja.endereco ?? '',
          numero: loja.numero ?? '',
          bairro: loja.bairro ?? '',
          cidade: loja.cidade ?? '',
          estado: loja.estado ?? '',
          cep: loja.cep ?? '',
          segmento: loja.segmento ?? '',
          vendedor_responsavel_id: loja.vendedor_responsavel_id ?? '',
          status: loja.status,
          observacoes: loja.observacoes ?? '',
        })
      } else {
        setForm({
          razao_social: '',
          nome_fantasia: '',
          cnpj: '',
          data_fundacao: '',
          whatsapp: '',
          telefone: '',
          email: '',
          endereco: '',
          numero: '',
          bairro: '',
          cidade: '',
          estado: '',
          cep: '',
          segmento: '',
          vendedor_responsavel_id: isAdmin ? '' : user?.id ?? '',
          status: 'ativo',
          observacoes: '',
        })
      }
    }
  }, [open, loja, isAdmin, user])

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    if (!form.nome_fantasia.trim()) {
      toast.error('Informe o nome fantasia')
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      nome_fantasia: form.nome_fantasia.trim(),
      vendedor_responsavel_id: form.vendedor_responsavel_id || null,
      data_fundacao: form.data_fundacao || null,
      cnpj: form.cnpj || null,
      whatsapp: form.whatsapp || null,
      telefone: form.telefone || null,
      email: form.email || null,
      endereco: form.endereco || null,
      numero: form.numero || null,
      bairro: form.bairro || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
      cep: form.cep || null,
      segmento: form.segmento || null,
      razao_social: form.razao_social || null,
      observacoes: form.observacoes || null,
    }
    const { error } = loja
      ? await supabase.from('lojas').update(payload).eq('id', loja.id)
      : await supabase.from('lojas').insert(payload)
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(loja ? 'Loja atualizada' : 'Loja criada')
    onOpenChange(false)
    loadAll()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{loja ? 'Editar loja' : 'Nova loja'}</DialogTitle>
          <DialogDescription>Cadastre os dados da loja cliente.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Nome fantasia</Label>
            <Input value={form.nome_fantasia} onChange={(e) => set('nome_fantasia', e.target.value)} placeholder="Ex: Casa do Construtor" />
          </div>
          <div className="space-y-1.5">
            <Label>Razão social</Label>
            <Input value={form.razao_social} onChange={(e) => set('razao_social', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>CNPJ</Label>
            <Input value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
          </div>
          <div className="space-y-1.5">
            <Label>Data de fundação</Label>
            <Input type="date" value={form.data_fundacao} onChange={(e) => set('data_fundacao', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Segmento</Label>
            <Select value={form.segmento} onValueChange={(v) => set('segmento', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {SEGMENTOS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>WhatsApp</Label>
            <Input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input value={form.telefone} onChange={(e) => set('telefone', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Endereço</Label>
            <Input value={form.endereco} onChange={(e) => set('endereco', e.target.value)} placeholder="Rua, avenida..." />
          </div>
          <div className="space-y-1.5">
            <Label>Número</Label>
            <Input value={form.numero} onChange={(e) => set('numero', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Bairro</Label>
            <Input value={form.bairro} onChange={(e) => set('bairro', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Cidade</Label>
            <Input value={form.cidade} onChange={(e) => set('cidade', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={form.estado} onValueChange={(v) => set('estado', v)}>
              <SelectTrigger>
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Selecione</SelectItem>
                {ESTADOS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>CEP</Label>
            <Input value={form.cep} onChange={(e) => set('cep', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Vendedor responsável</Label>
            <Select
              value={form.vendedor_responsavel_id}
              onValueChange={(v) => set('vendedor_responsavel_id', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem responsável</SelectItem>
                {vendedores.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
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
