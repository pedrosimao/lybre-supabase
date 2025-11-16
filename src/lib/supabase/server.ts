import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getRequestEvent } from 'solid-js/web'
import { getCookie, setCookie, deleteCookie } from 'vinxi/http'

export function createClient() {
  const event = getRequestEvent()

  if (!event) {
    throw new Error('No request event available')
  }

  return createSupabaseClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
        storage: {
          getItem: (key: string) => {
            return getCookie(event, key) ?? null
          },
          setItem: (key: string, value: string) => {
            setCookie(event, key, value, {
              maxAge: 60 * 60 * 24 * 7, // 1 week
              path: '/',
            })
          },
          removeItem: (key: string) => {
            deleteCookie(event, key)
          },
        },
      },
    }
  )
}
