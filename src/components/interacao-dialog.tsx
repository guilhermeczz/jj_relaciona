import { useState } from 'react'
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
import type { Interacao } from '@/types'

const TIPOS = ['WhatsApp', 'Ligação', 'Visita', 'Brinde', 'Treinamento', 'Observação']

export function InteracaoDialog({
  open,
  onOpenChange,
  lojaId,
  contatoId,
  usuarioId,
  contatos,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lojaId: string
  contatoId?: string | null
  usuarioId: string
  contatos: { id: string; nome: string }[]
}) {
  const { loadAll } = useData()
  const [tipo, setTipo] = useState(contatoId ? 'WhatsApp' : 'Observação')
  const [descricao, setDescricao] = useState('')
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10))
  const [selectedContato, setSelectedContato] = useState(contatoId ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!descricao.trim()) {
      toast.error('Informe uma descrição')
      return
    }
    setSaving(true)
    const payload: Partial<Interacao> = {
      loja_id: lojaId,
      contato_id: selectedContato || null,
      usuario_id: usuarioId,
      tipo,
      descricao: descricao.trim(),
      data_interacao: new Date(data + 'T12:00:00').toISOString(),
    }
    const { error } = await supabase.from('interacoes').insert(payload)
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Interação registrada')
    onOpenChange(false)
    setDescricao('')
    loadAll()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar interação</DialogTitle>
          <DialogDescription>Registre o contato realizado com a loja.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {contatos.length > 0 && (
            <div className="space-y-1.5">
              <Label>Contato da loja (opcional)</Label>
              <Select value={selectedContato} onValueChange={setSelectedContato}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um contato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem contato específico</SelectItem>
                  {contatos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Data</Label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              placeholder="Descreva o que foi tratado..."
            />
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
