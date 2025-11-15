import { createSignal, createContext, useContext, onMount, ParentComponent, JSX } from 'solid-js'
import { isServer } from 'solid-js/web'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: () => Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType>()

export interface ThemeProviderProps {
  attribute?: string
  defaultTheme?: Theme
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
  children: JSX.Element
}

export const ThemeProvider: ParentComponent<ThemeProviderProps> = (props) => {
  const [theme, setThemeState] = createSignal<Theme>(props.defaultTheme || 'dark')

  onMount(() => {
    if (isServer) return
    
    const stored = localStorage.getItem('theme') as Theme
    if (stored) {
      setThemeState(stored)
      applyTheme(stored)
    } else {
      applyTheme(props.defaultTheme || 'dark')
    }
  })

  const applyTheme = (newTheme: Theme) => {
    if (isServer) return
    
    const root = document.documentElement
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const actualTheme = newTheme === 'system' ? systemTheme : newTheme
    
    root.classList.remove('light', 'dark')
    root.classList.add(actualTheme)
    
    if (props.attribute === 'class') {
      root.classList.add(actualTheme)
    }
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    if (!isServer) {
      localStorage.setItem('theme', newTheme)
      applyTheme(newTheme)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {props.children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
