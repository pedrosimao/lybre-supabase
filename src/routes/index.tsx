import { createAsync, redirect, cache } from '@solidjs/router'
import { getUser } from '~/server/auth'

const loadUser = cache(async () => {
  'use server'
  return await getUser()
}, 'user')

export const route = {
  preload: () => loadUser(),
}

export default function HomePage() {
  const user = createAsync(() => loadUser())

  if (!user()) {
    return redirect('/login')
  }

  return redirect('/portfolio')
}
