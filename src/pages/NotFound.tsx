import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'

export function NotFound() {
  const { user } = useAuth()
  if (user) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-20 text-center">
        <p className="text-6xl font-black text-brand-black">404</p>
        <p className="mt-2 text-muted-foreground">Página não encontrada.</p>
        <Button asChild variant="accent" className="mt-6">
          <Link to="/dashboard">Voltar ao início</Link>
        </Button>
      </div>
    )
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-gray text-center">
      <p className="text-6xl font-black text-brand-black">404</p>
      <p className="mt-2 text-muted-foreground">Página não encontrada.</p>
      <Button asChild variant="accent" className="mt-6">
        <Link to="/login">Ir para o login</Link>
      </Button>
    </div>
  )
}
