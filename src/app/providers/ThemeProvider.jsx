import { useCallback, useEffect, useMemo, useState } from 'react'
import { DARK_CLASS, THEMES } from '../../features/theme/constants/theme.js'
import { ThemeContext } from '../../features/theme/hooks/themeContext.js'
import { STORAGE_KEYS } from '../../utils/constants.js'

function readTheme() {
  const stored = localStorage.getItem(STORAGE_KEYS.theme)
  if (stored === THEMES.dark || stored === THEMES.light) return stored
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return THEMES.dark
  }
  return THEMES.light
}

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readTheme)

  useEffect(() => {
    document.documentElement.classList.toggle(DARK_CLASS, theme === THEMES.dark)
    document.documentElement.style.colorScheme = theme
    localStorage.setItem(STORAGE_KEYS.theme, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === THEMES.light ? THEMES.dark : THEMES.light))
  }, [])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
