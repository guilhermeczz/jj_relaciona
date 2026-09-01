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
    username: '',
    senha: '',
    perfil: 'vendedor',
    telefone: '',
    ativo: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && perfil) {
      setForm({
        nome: perfil.nome,
        username: perfil.username,
        senha: '',
        perfil: perfil.perfil,
        telefone: perfil.telefone ?? '',
        ativo: perfil.ativo,
      })
    } else if (open) {
      setForm({ nome: '', username: '', senha: '', perfil: 'vendedor', telefone: '', ativo: true })
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
    if (!perfil && !/^[a-z0-9._-]{3,30}$/.test(form.username)) {
      setSaving(false)
      toast.error('O username deve ter de 3 a 30 caracteres e usar apenas letras, números, ponto, hífen ou underline.')
      return
    }
    if (!perfil && !/^\d{6}$/.test(form.senha)) {
      setSaving(false)
      toast.error('A senha precisa ter exatamente 6 números.')
      return
    }
    const { error } = perfil
      ? await supabase.from('profiles').update(payload).eq('id', perfil.id)
      : await supabase.functions.invoke('criar-usuario', {
          body: { ...payload, username: form.username, senha: form.senha },
        })
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
              ? 'Edite os dados e o status deste acesso.'
              : 'Defina o username e uma senha numérica de 6 dígitos.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Username</Label>
            <Input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, '') }))}
              disabled={!!perfil}
              placeholder="ex.: joao.silva"
            />
          </div>
          {!perfil && (
            <div className="space-y-1.5">
              <Label>Senha inicial (6 números)</Label>
              <Input
                type="password"
                inputMode="numeric"
                minLength={6}
                maxLength={6}
                value={form.senha}
                onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                placeholder="••••••"
              />
            </div>
          )}
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
          {!perfil && <p className="text-xs text-muted-foreground">A conta será criada já confirmada, sem envio de e-mail.</p>}
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
