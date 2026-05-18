'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  resolved: ResolvedTheme
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  resolved: 'light',
  setMode: () => {},
})

const STORAGE_KEY = 'trip-planner.theme'

export function useTheme() {
  return useContext(ThemeContext)
}

function resolveSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyResolved(resolved: ResolvedTheme) {
  const root = document.documentElement
  if (resolved === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [resolved, setResolved] = useState<ResolvedTheme>('light')

  // Hydration 단계: 저장된 mode 읽고 적용
  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'system'
    setModeState(saved)
    const next: ResolvedTheme = saved === 'system' ? resolveSystemTheme() : saved
    setResolved(next)
    applyResolved(next)
  }, [])

  // mode가 'system'일 때 OS 변경 감지
  useEffect(() => {
    if (mode !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      const next: ResolvedTheme = media.matches ? 'dark' : 'light'
      setResolved(next)
      applyResolved(next)
    }
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [mode])

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    localStorage.setItem(STORAGE_KEY, next)
    const resolvedNext: ResolvedTheme =
      next === 'system' ? resolveSystemTheme() : next
    setResolved(resolvedNext)
    applyResolved(resolvedNext)
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolved, setMode }),
    [mode, resolved, setMode],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
