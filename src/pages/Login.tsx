import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Package, ShieldCheck, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { isSupabaseConfigured } from '@/lib/supabase'

export function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isSupabaseConfigured()) {
      toast.error('Conecte o Supabase nas variáveis de ambiente para acessar.')
      return
    }
    if (!/^[a-z0-9._-]{3,30}$/i.test(username.trim())) {
      toast.error('Digite um username válido.')
      return
    }
    if (!/^\d{6}$/.test(password)) {
      toast.error('A senha deve ter exatamente 6 números.')
      return
    }
    setLoading(true)
    const { error } = await signIn(username, password)
    setLoading(false)
    if (error) {
      toast.error('Username ou senha incorretos.')
      return
    }
    toast.success('Bem-vindo ao ConstruJota Relaciona!')
    navigate('/dashboard')
  }

  return (
    <main className="login-light grid min-h-screen bg-[#121212] lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -left-32 bottom-[-22rem] h-[42rem] w-[42rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute right-[-10rem] top-[-12rem] h-[34rem] w-[34rem] rounded-full border-[90px] border-white/[0.025]" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-brand-black">
            <Package className="h-7 w-7" strokeWidth={2.5} />
          </div>
          <div className="leading-[1.05]">
            <p className="text-lg font-extrabold text-white">ConstruJota</p>
            <p className="text-lg font-extrabold text-accent">Relaciona</p>
          </div>
        </div>

        <div className="relative max-w-xl pb-10">
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white xl:text-5xl">
            Relacionamentos que constroem resultados.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/55">
            Lojas, contatos, aniversários e ações de relacionamento em um só lugar para o time comercial da ConstruJota.
          </p>
          <div className="mt-10 flex gap-8 border-t border-white/10 pt-7 text-sm text-white/55">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Acesso protegido</span>
            <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" /> Feito para vendedores</span>
          </div>
        </div>

        <p className="relative text-xs text-white/30">© {new Date().getFullYear()} ConstruJota · Uso interno</p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-brand-gray px-5 py-10 sm:px-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-9 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-brand-black">
              <Package className="h-6 w-6" />
            </div>
            <div className="leading-none">
              <p className="font-extrabold">ConstruJota</p>
              <p className="mt-1 font-extrabold text-[#b98e00]">Relaciona</p>
            </div>
          </div>

          <div className="surface-shadow rounded-[24px] border bg-white p-6 sm:p-9">
            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a7800]">Área exclusiva</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-brand-black">Acesse sua conta</h2>
              <p className="mt-2 text-sm text-muted-foreground">Use o username e a senha recebidos do administrador.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  inputMode="text"
                  placeholder="ex.: joao.silva"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  required
                  className="h-12 rounded-xl bg-[#fbfbfa] px-4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha de 6 dígitos</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? 'text' : 'password'}
                    inputMode="numeric"
                    autoComplete="current-password"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    minLength={6}
                    maxLength={6}
                    required
                    className="h-12 rounded-xl bg-[#fbfbfa] px-4 pr-12 tracking-[0.35em]"
                  />
                  <button
                    type="button"
                    aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'} {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>
          </div>

        </div>
      </section>
    </main>
  )
}
