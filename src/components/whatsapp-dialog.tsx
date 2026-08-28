import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { buildWhatsAppLink } from '@/lib/whatsapp'

export function WhatsAppDialog({
  open,
  onOpenChange,
  phone,
  defaultMessage,
  title = 'Enviar mensagem no WhatsApp',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  phone?: string | null
  defaultMessage: string
  title?: string
}) {
  const [message, setMessage] = useState(defaultMessage)

  useEffect(() => {
    if (open) setMessage(defaultMessage)
  }, [open, defaultMessage])

  const link = buildWhatsAppLink(phone ?? '', message)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Edite a mensagem e abra diretamente no WhatsApp.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Escreva a mensagem..."
          />
          {!phone && <p className="text-xs text-destructive">Nenhum telefone cadastrado para este contato.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="accent"
            disabled={!phone}
            onClick={() => {
              window.open(link, '_blank', 'noopener')
              onOpenChange(false)
            }}
          >
            <ExternalLink className="h-4 w-4" />
            Abrir WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
