import { createClient } from '~/lib/supabase/server'
import { redirect } from '@solidjs/router'
import { revalidate, action } from '@solidjs/router'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Form actions - these use action() wrapper as they handle FormData
export const signUp = action(async (formData: FormData) => {
  'use server'

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  if (!email || !password || !name) {
    return { error: 'All fields are required' }
  }

  try {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

    revalidate('user')
    return redirect('/portfolio')
  } catch (error) {
    return { error: 'Failed to create user' }
  }
})

export const signIn = action(async (formData: FormData) => {
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

  revalidate('user')
  return redirect('/portfolio')
})

export const signOut = action(async () => {
  'use server'

  const supabase = createClient()
  await supabase.auth.signOut()
  revalidate('user')
  return redirect('/login')
})

// Regular server function - not a form action
export async function getUser() {
  'use server'

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
