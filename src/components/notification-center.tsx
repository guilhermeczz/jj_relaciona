import { useCallback, useEffect, useState } from 'react'
import { Bell, Store } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'

interface Notification {
  id: string
  titulo: string
  mensagem: string
  lida: boolean
  created_at: string
}

function formatMoment(value: string) {
  const date = new Date(value)
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(date)
  const day = new Intl.DateTimeFormat('pt-BR').format(date)
  return `${time}hrs - ${day}`
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const unread = notifications.filter((notification) => !notification.lida).length

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('notificacoes')
      .select('id, titulo, mensagem, lida, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    const next = (data as Notification[] | null) ?? []
    setNotifications(next)
    return next
  }, [])

  useEffect(() => {
    load()
    const interval = window.setInterval(load, 30_000)
    window.addEventListener('focus', load)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', load)
    }
  }, [load])

  async function handleOpen(open: boolean) {
    if (!open) return
    const current = await load()
    const unreadIds = current.filter((notification) => !notification.lida).map((notification) => notification.id)
    if (!unreadIds.length) return
    setNotifications((current) => current.map((notification) => ({ ...notification, lida: true })))
    await supabase.from('notificacoes').update({ lida: true, lida_em: new Date().toISOString() }).in('id', unreadIds)
  }

  return (
    <DropdownMenu onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <button aria-label={`Notificações${unread ? `, ${unread} não lidas` : ''}`} className="relative flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground sm:h-10 sm:w-10">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-extrabold text-brand-black ring-2 ring-white dark:ring-card">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[70dvh] w-[calc(100vw-1rem)] max-w-sm overflow-y-auto p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
          <span>Central de notificações</span>
          <span className="text-[10px] font-normal text-muted-foreground">últimas 50</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="m-0" />
        {!notifications.length ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma notificação.</p>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div key={notification.id} className="flex gap-3 px-4 py-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-[#9a7800]">
                  <Store className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{notification.titulo}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{notification.mensagem}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{formatMoment(notification.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
