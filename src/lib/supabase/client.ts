import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  return createSupabaseClient(
    import.meta.env.VITE_NEXT_PUBLIC_!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  )
}
