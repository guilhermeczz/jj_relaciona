import { lazy } from 'react'
import { createBrowserRouter, Navigate, Outlet, useRouteError } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { DataProvider } from '@/context/DataContext'
import { AppLayout } from '@/layouts/AppLayout'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

const Login = lazy(() => import('@/pages/Login').then((module) => ({ default: module.Login })))
const Dashboard = lazy(() => import('@/pages/Dashboard').then((module) => ({ default: module.Dashboard })))
const Lojas = lazy(() => import('@/pages/Lojas').then((module) => ({ default: module.Lojas })))
const LojaDetalhe = lazy(() => import('@/pages/LojaDetalhe').then((module) => ({ default: module.LojaDetalhe })))
const Contatos = lazy(() => import('@/pages/Contatos').then((module) => ({ default: module.Contatos })))
const Aniversariantes = lazy(() => import('@/pages/Aniversariantes').then((module) => ({ default: module.Aniversariantes })))
const Treinamentos = lazy(() => import('@/pages/Treinamentos').then((module) => ({ default: module.Treinamentos })))
const Brindes = lazy(() => import('@/pages/Brindes').then((module) => ({ default: module.Brindes })))
const Interacoes = lazy(() => import('@/pages/Interacoes').then((module) => ({ default: module.Interacoes })))
const Relatorios = lazy(() => import('@/pages/Relatorios').then((module) => ({ default: module.Relatorios })))
const Usuarios = lazy(() => import('@/pages/Usuarios').then((module) => ({ default: module.Usuarios })))
const Configuracoes = lazy(() => import('@/pages/Configuracoes').then((module) => ({ default: module.Configuracoes })))
const NotFound = lazy(() => import('@/pages/NotFound').then((module) => ({ default: module.NotFound })))

function Providers() {
  return (
    <AuthProvider>
      <DataProvider>
        <Outlet />
      </DataProvider>
    </AuthProvider>
  )
}

function RouteError() {
  const error = useRouteError()
  const message = error instanceof Error ? error.message : 'Não foi possível carregar esta página.'

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-gray p-5">
      <div className="surface-shadow w-full max-w-md rounded-2xl border bg-white p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-xl font-extrabold text-brand-black">Algo não carregou corretamente</h1>
        <p className="mt-2 text-sm text-muted-foreground">Atualize a página para restabelecer sua sessão.</p>
        {import.meta.env.DEV && <p className="mt-3 rounded-lg bg-muted p-2 text-xs text-muted-foreground">{message}</p>}
        <Button variant="accent" className="mt-6 w-full" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" /> Recarregar sistema
        </Button>
      </div>
    </main>
  )
}

function Protected() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <AppLayout />
}

function AdminOnly() {
  const { isAdmin } = useAuth()
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export const router = createBrowserRouter([
  {
    element: <Providers />,
    errorElement: <RouteError />,
    children: [
      { path: '/login', element: <Login /> },
      {
        element: <Protected />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/lojas', element: <Lojas /> },
          { path: '/lojas/:id', element: <LojaDetalhe /> },
          { path: '/contatos', element: <Contatos /> },
          { path: '/aniversariantes', element: <Aniversariantes /> },
          { path: '/brindes', element: <Brindes /> },
          { path: '/interacoes', element: <Interacoes /> },
          {
            element: <AdminOnly />,
            children: [
              { path: '/treinamentos', element: <Treinamentos /> },
              { path: '/relatorios', element: <Relatorios /> },
              { path: '/usuarios', element: <Usuarios /> },
              { path: '/configuracoes', element: <Configuracoes /> },
            ],
          },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
])
