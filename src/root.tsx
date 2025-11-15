// @refresh reload
import { Suspense } from 'solid-js'
import {
  A,
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title,
} from '@solidjs/start'
import { ThemeProvider } from '~/components/theme-provider'
import './app.css'

export default function Root() {
  return (
    <Html lang="en">
      <Head>
        <Title>Lybre - Portfolio Tracker</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta name="description" content="Track your stock portfolio with AI-powered insights" />
      </Head>
      <Body>
        <Suspense>
          <ErrorBoundary>
            <ThemeProvider attribute="class" defaultTheme="dark">
              <Routes>
                <FileRoutes />
              </Routes>
            </ThemeProvider>
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  )
}
