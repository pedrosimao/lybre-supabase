import { Router } from '@solidjs/router'
import { FileRoutes } from '@solidjs/start/router'
import { Suspense } from 'solid-js'
import { ThemeProvider } from '~/components/theme-provider'
import './app.css'

export default function App() {
  return (
    <Router
      root={(props) => (
        <ThemeProvider attribute="class" defaultTheme="dark">
          <Suspense>{props.children}</Suspense>
        </ThemeProvider>
      )}
    >
      <FileRoutes />
    </Router>
  )
}
