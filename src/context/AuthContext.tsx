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

const USERNAME_DOMAIN = 'jj.com'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function authUser(sessionUser: { id: string; email?: string | null } | undefined) {
  return sessionUser ? { id: sessionUser.id, email: sessionUser.email ?? null } : null
}

function sameUser(current: AuthContextValue['user'], next: AuthContextValue['user']) {
  return current?.id === next?.id && current?.email === next?.email
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      const nextUser = authUser(data.session?.user)
      setUser((current) => sameUser(current, nextUser) ? current : nextUser)
      setAuthReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = authUser(session?.user)
      // TOKEN_REFRESHED tambem passa por aqui. Manter a mesma referencia evita
      // desmontar a tela e perder seu estado quando a aba volta do segundo plano.
      setUser((current) => sameUser(current, nextUser) ? current : nextUser)
      setAuthReady(true)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    async function loadProfile() {
      if (!authReady) return
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
      if (loadedProfile && !loadedProfile.ativo) {
        await supabase.auth.signOut()
        setProfile(null)
        setLoading(false)
        return
      }
      if (error || !loadedProfile) {
        setProfile(null)
        setLoading(false)
        return
      }
      setProfile(loadedProfile)
      setLoading(false)
    }
    loadProfile()
  }, [authReady, user?.id])

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
