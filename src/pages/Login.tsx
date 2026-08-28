import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { isSupabaseConfigured } from '@/lib/supabase'

export function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isSupabaseConfigured()) {
      toast.error('Supabase não está configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
      return
    }
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Bem-vindo!')
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen bg-brand-black">
      <div className="hidden w-1/2 flex-col justify-between bg-brand-black p-12 lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-brand-black">
            <Package className="h-6 w-6" />
          </div>
          <div className="leading-tight text-white">
            <p className="text-xl font-bold">JJ Relaciona</p>
            <p className="text-sm text-white/50">ConstruJota · Distribuidora</p>
          </div>
        </div>
        <div className="text-white">
          <h2 className="max-w-md text-3xl font-bold leading-tight">
            Centralize o relacionamento com suas lojas e vendedores parceiros.
          </h2>
          <p className="mt-3 max-w-md text-white/60">
            CRM comercial para fortalecer parcerias, acompanhar campanhas, treinamentos, brindes e aniversários.
          </p>
        </div>
        <p className="text-sm text-white/40">© {new Date().getFullYear()} JJ Relaciona · ConstruJota</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-brand-gray p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-brand-black">
              <Package className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-lg font-bold text-brand-black">JJ Relaciona</p>
              <p className="text-xs text-muted-foreground">ConstruJota</p>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <h1 className="text-xl font-bold text-brand-black">Acessar sistema</h1>
            <p className="mt-1 text-sm text-muted-foreground">Entre com seu e-mail e senha.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@empresa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </div>
          {!isSupabaseConfigured() && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Modo de desenvolvimento: configure <code>VITE_SUPABASE_URL</code> e{' '}
              <code>VITE_SUPABASE_ANON_KEY</code> no arquivo <code>.env</code> para autenticar.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
