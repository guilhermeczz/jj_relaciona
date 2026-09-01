import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/context/AuthContext'
import { DataProvider } from '@/context/DataContext'
import { router } from '@/router'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <DataProvider>
        <React.Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-brand-gray"><div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-black border-t-accent" /></div>}>
          <RouterProvider router={router} />
        </React.Suspense>
        <Toaster position="top-right" richColors closeButton />
      </DataProvider>
    </AuthProvider>
  </React.StrictMode>,
)
