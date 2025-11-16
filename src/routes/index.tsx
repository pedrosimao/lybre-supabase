import { getUser } from '~/server/auth'

export async function GET() {
  'use server'

  const user = await getUser()

  if (!user) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/login' }
    })
  }

  return new Response(null, {
      status: 302,
    headers: { Location: '/portfolio' }
  })
}

export default function HomePage() {
  return null
}
