import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Store,
  Users,
  Cake,
  Gift,
  GraduationCap,
  MessageSquare,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
  Package,
  CalendarDays,
  MoreHorizontal,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/lojas', label: 'Lojas', icon: Store },
  { to: '/contatos', label: 'Contatos', icon: Users },
  { to: '/aniversariantes', label: 'Aniversariantes', icon: Cake },
  { to: '/treinamentos', label: 'Treinamentos', icon: GraduationCap, adminOnly: true },
  { to: '/brindes', label: 'Brindes', icon: Gift, adminOnly: true },
  { to: '/interacoes', label: 'Interações', icon: MessageSquare },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3, adminOnly: true },
  { to: '/usuarios', label: 'Usuários', icon: UserCog, adminOnly: true },
  { to: '/configuracoes', label: 'Configurações', icon: Settings, adminOnly: true },
]

const sellerMobile = [
  { to: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { to: '/lojas', label: 'Lojas', icon: Store },
  { to: '/aniversariantes', label: 'Agenda', icon: CalendarDays },
  { to: '/contatos', label: 'Contatos', icon: Users },
  { to: '/interacoes', label: 'Interações', icon: MessageSquare },
]

const adminMobile = [
  { to: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { to: '/lojas', label: 'Lojas', icon: Store },
  { to: '/aniversariantes', label: 'Agenda', icon: CalendarDays },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/configuracoes', label: 'Mais', icon: MoreHorizontal },
]

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-brand-black shadow-[0_8px_20px_rgba(255,202,5,0.22)]">
        <Package className="h-6 w-6" strokeWidth={2.5} />
      </div>
      <div className="leading-[1.05]">
        <p className="text-[15px] font-extrabold tracking-tight text-white">ConstruJota</p>
        <p className="text-[15px] font-extrabold tracking-tight text-accent">Relaciona</p>
      </div>
    </div>
  )
}

export function Sidebar() {
  const { profile, signOut } = useAuth()
  const links = profile?.perfil === 'admin' ? nav : nav.filter((n) => !n.adminOnly)

  return (
    <aside className="sticky top-0 hidden h-screen w-[258px] shrink-0 flex-col bg-[#121212] text-white md:flex">
      <div className="px-6 pb-7 pt-6">
        <Brand />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-accent text-brand-black shadow-[0_8px_24px_rgba(255,202,5,0.13)]'
                  : 'text-white/65 hover:bg-white/[0.07] hover:text-white',
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl p-2">
          <Avatar className="h-10 w-10 border border-white/10 bg-white text-brand-black">
            <AvatarFallback className="font-bold">
              {profile?.nome?.slice(0, 2).toUpperCase() ?? '--'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold">{profile?.nome ?? 'Usuário'}</p>
            <p className="mt-1 text-[11px] capitalize text-white/45">{profile?.perfil ?? ''}</p>
          </div>
          <ThemeToggle className="h-9 w-9 text-white/55 hover:bg-white/10 hover:text-white" />
          <Button
            aria-label="Sair do sistema"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-white/55 hover:bg-white/10 hover:text-white"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const { isAdmin } = useAuth()
  const links = isAdmin ? adminMobile : sellerMobile

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-black/10 bg-white/95 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#151619]/95 md:hidden">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'relative flex min-h-[62px] flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors',
              isActive ? 'text-foreground' : 'text-muted-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-accent" />}
              <Icon className={cn('h-5 w-5', isActive && 'fill-accent/30')} strokeWidth={isActive ? 2.4 : 1.8} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
