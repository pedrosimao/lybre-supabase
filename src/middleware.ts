import { createMiddleware } from '@solidjs/start/middleware'
import { getCookie, setCookie } from 'vinxi/http'
import { createClient } from '@supabase/supabase-js'

export default createMiddleware({
  onRequest: async (event) => {
    const url = new URL(event.request.url)
    
    // Skip static files and API routes
    if (
      url.pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/) ||
      url.pathname.startsWith('/_')
    ) {
      return
    }

    // Create Supabase client with cookie handling
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storage: {
            getItem: (key) => getCookie(event, key) ?? null,
            setItem: (key, value) => setCookie(event, key, value, { maxAge: 60 * 60 * 24 * 7, path: '/' }),
            removeItem: (key) => setCookie(event, key, '', { maxAge: 0 }),
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const isAuthPage = url.pathname.startsWith('/login')
    const isProtectedPage = url.pathname.startsWith('/portfolio') || url.pathname.startsWith('/transcript')

    // Redirect to login if user is not authenticated and trying to access protected page
    if (!user && isProtectedPage) {
      return Response.redirect(new URL('/login', event.request.url), 302)
    }

    // Redirect to portfolio if user is already authenticated and trying to access login
    if (user && isAuthPage) {
      return Response.redirect(new URL('/portfolio', event.request.url), 302)
    }
  },
})
