import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'signal' | 'system'
type ResolvedTheme = 'light' | 'dark' | 'signal'

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

/** Signal is a dark-based theme: `.dark` stays on so every dark: variant
 *  applies, and `.signal` layers the palette + signal: variants on top. */
function applyThemeClasses(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle('dark', resolved === 'dark' || resolved === 'signal')
  document.documentElement.classList.toggle('signal', resolved === 'signal')
}

const ThemeContext = createContext<{
  theme: Theme
  resolved: ResolvedTheme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}>({ theme: 'dark', resolved: 'dark', setTheme: () => {}, toggleTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) ?? 'dark'
  })
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(
    (localStorage.getItem('theme') as Theme) ?? 'dark'
  ))

  useEffect(() => {
    const r = resolveTheme(theme)
    setResolved(r)
    applyThemeClasses(r)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Listen for OS preference changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const r = resolveTheme('system')
      setResolved(r)
      applyThemeClasses(r)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  const setTheme = (t: Theme) => setThemeState(t)
  // Signal counts as the dark family: toggling from it goes to light.
  const toggleTheme = () => setThemeState(t => (t === 'light' ? 'dark' : 'light'))

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
