import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Sidebar, MobileNav } from '@/components/layout/Sidebar'
import { useAuth } from '@/context/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'

export function AppLayout() {
  const { loading, profile } = useAuth()

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      toast.warning('Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY', {
        duration: 8000,
      })
    }
  }, [])

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
      <div className="flex min-h-screen w-full min-w-0 flex-col pb-16 md:pb-0">
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
