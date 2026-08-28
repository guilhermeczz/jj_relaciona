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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useData } from '@/context/DataContext'
import type { Profile } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  perfil?: Profile | null
}

export function PerfilDialog({ open, onOpenChange, perfil }: Props) {
  const { loadAll } = useData()
  const [form, setForm] = useState({
    nome: '',
    email: '',
    perfil: 'vendedor',
    telefone: '',
    ativo: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && perfil) {
      setForm({
        nome: perfil.nome,
        email: perfil.email,
        perfil: perfil.perfil,
        telefone: perfil.telefone ?? '',
        ativo: perfil.ativo,
      })
    }
  }, [open, perfil])

  async function handleSubmit() {
    setSaving(true)
    const payload = {
      nome: form.nome.trim(),
      perfil: form.perfil,
      telefone: form.telefone || null,
      ativo: form.ativo,
    }
    const { error } = perfil
      ? await supabase.from('profiles').update(payload).eq('id', perfil.id)
      : await supabase.from('profiles').insert({ ...payload, email: form.email })
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(perfil ? 'Perfil atualizado' : 'Perfil criado')
    onOpenChange(false)
    loadAll()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{perfil ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
          <DialogDescription>
            {perfil
              ? 'Edite os dados do usuário cadastrado no Supabase Auth.'
              : 'Crie um perfil vinculado a um usuário existente do Supabase Auth.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail (ID do Auth)</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              disabled={!!perfil}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Perfil</Label>
            <Select value={form.perfil} onValueChange={(v) => setForm((f) => ({ ...f, perfil: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="vendedor">Vendedor</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input value={form.telefone} onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))} />
          </div>
          {perfil && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.ativo ? 'ativo' : 'inativo'} onValueChange={(v) => setForm((f) => ({ ...f, ativo: v === 'ativo' }))}>
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
          {!perfil && (
            <p className="text-xs text-muted-foreground">
              O usuário precisa existir no Supabase Auth. Crie o usuário no painel do Supabase e informe o
              e-mail acima para vincular o perfil.
            </p>
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
