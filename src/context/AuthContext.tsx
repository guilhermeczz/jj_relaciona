import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

interface AuthContextValue {
  user: { id: string; email: string | null } | null
  profile: Profile | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const USERNAME_DOMAIN = 'usuarios.construjota.com.br'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null
      setUser(u ? { id: u.id, email: u.email ?? null } : null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u ? { id: u.id, email: u.email ?? null } : null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      const loadedProfile = (data as Profile) ?? null
      if (error || !loadedProfile?.ativo) {
        await supabase.auth.signOut()
        setProfile(null)
        setLoading(false)
        return
      }
      setProfile(loadedProfile)
      setLoading(false)
    }
    loadProfile()
  }, [user])

  async function signIn(username: string, password: string) {
    const normalizedUsername = username.trim().toLowerCase().replace(/\s+/g, '')
    const email = `${normalizedUsername}@${USERNAME_DOMAIN}`
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signOut, isAdmin: profile?.perfil === 'admin' }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
