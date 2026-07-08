import { createClient, type Session } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const isSupabaseConfigured =
  Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('your-project'))

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
)

/** Validate with the server and return a fresh access token for Edge Functions. */
export async function ensureValidSession(): Promise<Session | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  const { data: refreshData, error: refreshError } =
    await supabase.auth.refreshSession()

  if (!refreshError && refreshData.session) {
    return refreshData.session
  }

  const { data: sessionData } = await supabase.auth.getSession()
  return sessionData.session
}

export function getEdgeFunctionErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'context' in error) {
    const body = (error as { context?: { body?: string } }).context?.body
    if (body) {
      try {
        const parsed = JSON.parse(body) as { error?: string }
        if (parsed.error === 'Unauthorized' || parsed.error === 'Missing authorization') {
          return 'เซสชันหมดอายุแล้ว กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่'
        }
        if (parsed.error) return parsed.error
      } catch {
        // fall through
      }
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('non-2xx')) {
      return 'เซสชันหมดอายุแล้ว กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่'
    }
    return error.message
  }

  return 'เกิดข้อผิดพลาด กรุณาลองใหม่'
}
