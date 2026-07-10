import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'clawreform-theme'

function getStoredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light'
  return 'dark'
}

export function useTheme() {
  const [theme, setThemeState] = useState(getStoredTheme)

  const applyTheme = useCallback((newTheme) => {
    setThemeState(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }, [])

  // Apply theme on mount (already set by inline script, but React needs to know)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
  }, [theme, applyTheme])

  return { theme, isLight: theme === 'light', toggleTheme }
}
