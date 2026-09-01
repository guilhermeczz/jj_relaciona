import { lazy } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AppLayout } from '@/layouts/AppLayout'

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
