import { cache } from '@solidjs/router'
import { redirect } from '@solidjs/router'
import { getUser } from '~/server/auth'

const loadUser = cache(async () => {
  'use server'

  const user = await getUser()

  // Server-side redirect - throw redirect response
  if (!user) {
    throw redirect('/login')
  }

  throw redirect('/portfolio')
}, 'user')

export const route = {
  preload: () => loadUser(),
}

export default function HomePage() {
  loadUser() // This will trigger the redirect
  return null
}
