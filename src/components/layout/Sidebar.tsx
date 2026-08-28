import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Store,
  Users,
  Cake,
  Gift,
  Megaphone,
  GraduationCap,
  MessageSquare,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
  Package,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/lojas', label: 'Lojas', icon: Store },
  { to: '/contatos', label: 'Contatos', icon: Users },
  { to: '/aniversariantes', label: 'Aniversariantes', icon: Cake },
  { to: '/campanhas', label: 'Campanhas', icon: Megaphone },
  { to: '/treinamentos', label: 'Treinamentos', icon: GraduationCap },
  { to: '/brindes', label: 'Brindes', icon: Gift },
  { to: '/interacoes', label: 'Interações', icon: MessageSquare },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/usuarios', label: 'Usuários', icon: UserCog, adminOnly: true },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

const mobile = [
  { to: '/lojas', label: 'Lojas', icon: Store },
  { to: '/aniversariantes', label: 'Aniver.', icon: Cake },
  { to: '/campanhas', label: 'Campanhas', icon: Megaphone },
  { to: '/treinamentos', label: 'Trein.', icon: GraduationCap },
  { to: '/dashboard', label: 'Início', icon: LayoutDashboard },
]

export function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const links = profile?.perfil === 'admin' ? nav : nav.filter((n) => !n.adminOnly)

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-brand-black text-white md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-brand-black">
          <Package className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="font-semibold">JJ Relaciona</p>
          <p className="text-xs text-white/50">ConstruJota</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-accent text-brand-black' : 'text-white/70 hover:bg-white/10 hover:text-white',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 bg-accent text-brand-black">
            <AvatarFallback className="font-semibold">
              {profile?.nome?.slice(0, 2).toUpperCase() ?? '--'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">{profile?.nome ?? 'Usuário'}</p>
            <p className="text-xs capitalize text-white/50">{profile?.perfil ?? ''}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:bg-white/10 hover:text-white"
            onClick={() => {
              signOut()
              navigate('/login')
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-white shadow md:hidden">
      {mobile.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium',
              isActive ? 'text-brand-black' : 'text-muted-foreground',
            )
          }
        >
          <Icon className="h-5 w-5" />
          {label}
        </NavLink>
      ))}
      <button
        onClick={() => {
          signOut()
          navigate('/login')
        }}
        className="flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium text-muted-foreground"
      >
        <LogOut className="h-5 w-5" />
        Sair
      </button>
    </nav>
  )
}
