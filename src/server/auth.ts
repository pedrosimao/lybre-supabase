import { createClient } from '~/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Form actions - plain server functions that handle FormData
export async function signUp(formData: FormData) {
  'use server'

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  if (!email || !password || !name) {
    return { error: 'All fields are required' }
  }

  try {
    const supabaseAdmin = createAdminClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true,
    })

    if (error) {
      return { error: error.message }
    }

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      return { error: signInError.message }
    }

    return new Response(null, {
      status: 302,
      headers: { Location: '/portfolio' },
    })
  } catch (error) {
    return { error: 'Failed to create user' }
  }
}

export async function signIn(formData: FormData) {
  'use server'

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return new Response(null, {
    status: 302,
    headers: { Location: '/portfolio' },
  })
}

export async function signOut() {
  'use server'

  const supabase = createClient()
  await supabase.auth.signOut()
  return new Response(null, {
    status: 302,
    headers: { Location: '/login' },
  })
}

// Regular server function - not a form action
export async function getUser() {
  'use server'

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
