import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { router } from '@/router'
import { ThemeProvider, useTheme } from '@/context/ThemeContext'
import '@/index.css'

function AppToaster() {
  const { resolvedTheme } = useTheme()
  return <Toaster position="top-right" richColors closeButton theme={resolvedTheme} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <React.Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-brand-gray"><div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-black border-t-accent" /></div>}>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </React.Suspense>
      <AppToaster />
    </ThemeProvider>
  </React.StrictMode>,
)
