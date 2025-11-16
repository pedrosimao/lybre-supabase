import { Suspense, type ParentProps } from 'solid-js'
import { ThemeProvider } from '~/components/theme-provider'
import './app.css'

export default function App(props: ParentProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <Suspense>{props.children}</Suspense>
    </ThemeProvider>
  )
}
