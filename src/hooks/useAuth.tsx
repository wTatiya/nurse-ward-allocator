import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { Profile, UserRole } from '../types/database'
import {
  nurseIdToAuthEmail,
  validateNurseIdInput,
  validatePasswordInput,
} from '../lib/nurseIdAuth'
import { translateAuthError } from '../lib/locale/th'

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  role: UserRole | null
  loading: boolean
  configured: boolean
  signIn: (nurseId: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    const userId = session?.user?.id
    if (!userId || !isSupabaseConfigured) {
      setProfile(null)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      setProfile(null)
      return
    }

    setProfile(data as Profile)
  }, [session?.user?.id])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    let mounted = true

    void (async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (error || !user) {
        setSession(null)
        setLoading(false)
        return
      }

      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (session?.user) {
      void refreshProfile()
    } else {
      setProfile(null)
    }
  }, [session, refreshProfile])

  const signIn = async (nurseId: string, password: string) => {
    const idError = validateNurseIdInput(nurseId)
    if (idError) return idError

    const passwordError = validatePasswordInput(password)
    if (passwordError) return passwordError

    const id = nurseId.trim()
    const { error } = await supabase.auth.signInWithPassword({
      email: nurseIdToAuthEmail(id),
      password,
    })
    return error?.message ? translateAuthError(error.message) : null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? null,
      loading,
      configured: isSupabaseConfigured,
      signIn,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
