import { Monitor, Moon, Palette, ShieldCheck, Sun, UserRound } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { type Theme, useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

const themeOptions: Array<{ value: Theme; label: string; description: string; icon: typeof Sun }> = [
  { value: 'light', label: 'Claro', description: 'Visual leve para ambientes iluminados', icon: Sun },
  { value: 'dark', label: 'Escuro', description: 'Mais conforto em locais com pouca luz', icon: Moon },
  { value: 'system', label: 'Automático', description: 'Acompanha a preferência do dispositivo', icon: Monitor },
]

export function Configuracoes() {
  const { profile } = useAuth()
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <PageHeader title="Preferências" description="Personalize sua experiência no ConstruJota Relaciona." />

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-[#9a7800] dark:text-accent" /> Aparência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Escolha o tema que oferece melhor leitura para o seu ambiente de trabalho.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {themeOptions.map(({ value, label, description, icon: Icon }) => {
                const selected = theme === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    aria-pressed={selected}
                    className={cn(
                      'min-h-32 rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      selected
                        ? 'border-accent bg-accent/10 shadow-[inset_0_0_0_1px_hsl(var(--accent))]'
                        : 'bg-background hover:border-accent/60 hover:bg-muted/60',
                    )}
                  >
                    <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', selected ? 'bg-accent text-brand-black' : 'bg-muted text-muted-foreground')}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="mt-3 block text-sm font-bold text-foreground">{label}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{description}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="h-4 w-4" /> Meu acesso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Nome" value={profile?.nome ?? '—'} />
            <InfoRow label="Username" value={profile?.username ?? '—'} />
            <InfoRow label="Perfil" value="Administrador" icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 rounded-xl bg-brand-gray px-4 py-3">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="flex min-w-0 items-center gap-2 text-right text-sm font-semibold capitalize text-foreground">
        {icon}
        <span className="truncate">{value}</span>
      </span>
    </div>
  )
}
