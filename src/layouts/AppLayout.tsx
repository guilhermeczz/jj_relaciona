import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Bell, CalendarDays, LogOut } from 'lucide-react'
import { Sidebar, MobileNav } from '@/components/layout/Sidebar'
import { useAuth } from '@/context/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'

export function AppLayout() {
  const { loading, profile, signOut } = useAuth()

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      toast.warning('Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY', {
        duration: 8000,
      })
    }
  }, [])

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-gray">
        <div className="flex h-10 w-10 animate-spin items-center justify-center rounded-full border-4 border-brand-black border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-brand-gray">
      <Sidebar />
      <div className="flex min-h-screen w-full min-w-0 flex-col pb-[76px] md:pb-0">
        <header className="sticky top-0 z-30 hidden h-[82px] items-center justify-between border-b bg-white/95 px-6 backdrop-blur lg:flex lg:px-8">
          <div>
            <p className="text-base font-bold text-brand-black">
              Olá, {profile.nome.split(' ')[0]}! <span aria-hidden="true">👋</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Veja o resumo do relacionamento com as lojas.</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 rounded-lg px-3 py-2">
              <CalendarDays className="h-4 w-4" />
              {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date())}
            </div>
            <button aria-label="Notificações" className="relative flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-accent" />
            </button>
            <span className="h-6 w-px bg-border" />
            <button onClick={signOut} className="flex h-10 items-center gap-2 rounded-xl px-3 font-medium hover:bg-muted hover:text-foreground">
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
