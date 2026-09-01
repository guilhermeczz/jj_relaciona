import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useData } from '@/context/DataContext'
import { Input } from '@/components/ui/input'
import { buildWhatsAppLink } from '@/lib/whatsapp'
import { exportCSV } from '@/lib/csv'
import type { Treinamento } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  treinamento?: Treinamento | null
}

export function ParParticipantesDialog({ open, onOpenChange, treinamento }: Props) {
  const { lojas, contatos, treinamentoParticipantes, loadAll } = useData()
  const [lojaId, setLojaId] = useState('')
  const [contatoId, setContatoId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setLojaId('')
      setContatoId('')
    }
  }, [open])

  const participantes = useMemo(
    () => treinamentoParticipantes.filter((participante) => participante.treinamento_id === treinamento?.id),
    [treinamentoParticipantes, treinamento],
  )
  const contatosDaLoja = lojaId ? contatos.filter((contato) => contato.loja_id === lojaId && contato.ativo) : []

  async function addParticipante() {
    if (!lojaId || !treinamento?.id) {
      toast.error('Selecione uma loja')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('treinamento_participantes').insert({
      treinamento_id: treinamento.id,
      loja_id: lojaId,
      contato_id: contatoId && contatoId !== 'none' ? contatoId : null,
      confirmado: false,
      compareceu: false,
    })
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Participante adicionado')
    setContatoId('')
    loadAll()
  }

  async function atualizarParticipante(id: string, campo: 'confirmado' | 'compareceu', valor: boolean) {
    const { error } = await supabase.from('treinamento_participantes').update({ [campo]: valor }).eq('id', id)
    if (error) toast.error(error.message)
    else loadAll()
  }

  async function removerParticipante(id: string) {
    const { error } = await supabase.from('treinamento_participantes').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Participante removido')
      loadAll()
    }
  }

  function conviteMessage(nome: string) {
    return `Olá, ${nome}! Convidamos você para o treinamento "${treinamento?.nome ?? ''}"${treinamento?.data ? ` no dia ${formatData(treinamento.data)}` : ''}${treinamento?.horario ? ` às ${treinamento.horario.slice(0, 5)}` : ''}${treinamento?.local ? `, em ${treinamento.local}` : ''}. Confirma sua presença?`
  }

  function convidar(participante: (typeof participantes)[number]) {
    const phone = participante.contato?.whatsapp ?? participante.contato?.telefone ?? participante.loja?.whatsapp ?? participante.loja?.telefone
    if (!phone) {
      toast.error('Sem WhatsApp cadastrado para este participante.')
      return
    }
    const nome = participante.contato?.nome ?? participante.loja?.nome_fantasia ?? 'cliente'
    window.open(buildWhatsAppLink(phone, conviteMessage(nome)), '_blank', 'noopener')
  }

  function exportar() {
    exportCSV(participantes.map((participante) => ({
      Loja: participante.loja?.nome_fantasia ?? '-',
      Contato: participante.contato?.nome ?? '-',
      Confirmado: participante.confirmado ? 'Sim' : 'Não',
      Compareceu: participante.compareceu ? 'Sim' : 'Não',
    })), `participantes_${(treinamento?.nome ?? 'treinamento').replace(/[^a-zA-Z0-9]/g, '_')}.csv`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Participantes · {treinamento?.nome ?? '-'}</DialogTitle>
          <DialogDescription>Convide lojas e seus contatos para o treinamento.</DialogDescription>
          <div className="pt-1"><Button size="sm" variant="outline" onClick={exportar}>Exportar CSV</Button></div>
        </DialogHeader>

        <div className="rounded-xl border bg-brand-gray p-4">
          <p className="mb-3 text-sm font-medium text-brand-black">Adicionar participante</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Select value={lojaId} onValueChange={(value) => { setLojaId(value); setContatoId('') }}>
              <SelectTrigger><SelectValue placeholder="Loja" /></SelectTrigger>
              <SelectContent>{lojas.map((loja) => <SelectItem key={loja.id} value={loja.id}>{loja.nome_fantasia}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={contatoId || 'none'} onValueChange={(value) => setContatoId(value === 'none' ? '' : value)}>
              <SelectTrigger><SelectValue placeholder="Contato (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum contato específico</SelectItem>
                {contatosDaLoja.map((contato) => <SelectItem key={contato.id} value={contato.id}>{contato.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="accent" onClick={addParticipante} disabled={saving}>{saving ? 'Adicionando...' : 'Adicionar'}</Button>
          </div>
        </div>

        <div className="max-h-72 space-y-2 overflow-y-auto">
          {!participantes.length ? <p className="py-6 text-center text-sm text-muted-foreground">Nenhum participante ainda.</p> : participantes.map((participante) => (
            <div key={participante.id} className="flex flex-col justify-between gap-3 rounded-xl border p-3 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="font-medium text-brand-black">{participante.loja?.nome_fantasia}{participante.contato ? ` · ${participante.contato.nome}` : ''}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs"><Input type="checkbox" className="h-4 w-4" checked={participante.confirmado} onChange={(event) => atualizarParticipante(participante.id, 'confirmado', event.target.checked)} /> Confirmado</label>
                  <label className="flex items-center gap-1.5 text-xs"><Input type="checkbox" className="h-4 w-4" checked={participante.compareceu} onChange={(event) => atualizarParticipante(participante.id, 'compareceu', event.target.checked)} /> Compareceu</label>
                </div>
              </div>
              <div className="flex gap-2"><Button size="sm" variant="accent" onClick={() => convidar(participante)}>WhatsApp</Button><Button size="sm" variant="ghost" onClick={() => removerParticipante(participante.id)}>Remover</Button></div>
            </div>
          ))}
        </div>

        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatData(data: string) {
  return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR')
}
