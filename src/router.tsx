import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AppLayout } from '@/layouts/AppLayout'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Lojas } from '@/pages/Lojas'
import { LojaDetalhe } from '@/pages/LojaDetalhe'
import { Contatos } from '@/pages/Contatos'
import { Aniversariantes } from '@/pages/Aniversariantes'
import { Campanhas } from '@/pages/Campanhas'
import { Treinamentos } from '@/pages/Treinamentos'
import { Brindes } from '@/pages/Brindes'
import { Interacoes } from '@/pages/Interacoes'
import { Relatorios } from '@/pages/Relatorios'
import { Usuarios } from '@/pages/Usuarios'
import { Configuracoes } from '@/pages/Configuracoes'
import { NotFound } from '@/pages/NotFound'

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
      { path: '/campanhas', element: <Campanhas /> },
      { path: '/treinamentos', element: <Treinamentos /> },
      { path: '/brindes', element: <Brindes /> },
      { path: '/interacoes', element: <Interacoes /> },
      { path: '/relatorios', element: <Relatorios /> },
      {
        element: <AdminOnly />,
        children: [{ path: '/usuarios', element: <Usuarios /> }],
      },
      { path: '/configuracoes', element: <Configuracoes /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
