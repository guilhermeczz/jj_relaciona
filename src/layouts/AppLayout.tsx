import { Outlet } from 'react-router-dom'
import { Bell, CalendarDays, LogOut, Package } from 'lucide-react'
import { Sidebar, MobileNav } from '@/components/layout/Sidebar'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/theme-toggle'

export function AppLayout() {
  const { loading, profile, signOut } = useAuth()

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
        <header className="safe-top sticky top-0 z-30 flex min-h-16 items-center justify-between border-b bg-white/95 px-4 backdrop-blur dark:bg-card/95 md:hidden">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-brand-black">
              <Package className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-extrabold text-foreground">ConstruJota</p>
              <p className="text-xs font-bold text-[#9a7800] dark:text-accent">Relaciona</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={signOut}
              aria-label="Sair do sistema"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>
        <header className="sticky top-0 z-30 hidden h-[82px] items-center justify-between border-b bg-white/95 px-6 backdrop-blur dark:bg-card/95 lg:flex lg:px-8">
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
            <ThemeToggle />
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
