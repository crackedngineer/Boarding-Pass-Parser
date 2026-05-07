'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { signInWithGoogle, signOut as apiSignOut, getMe } from '@/lib/api/auth-service'
import httpClient from '@/lib/api/http-client'
import type { User } from '@/lib/types'

function getTokenExpiry(token: string): number | null {
  try { return (JSON.parse(atob(token.split('.')[1])) as { exp?: number }).exp ?? null }
  catch { return null }
}

interface AuthState {
  isLoading: boolean
  isAuthenticated: boolean
  user: User | null
  error: string | null
}

function enrichUser(u: User): User {
  return {
    ...u,
    name: u.name ?? (u.user_metadata?.full_name ?? u.user_metadata?.name) as string | undefined,
  }
}

export function useAuth(): AuthState & {
  signIn: (_provider: 'google') => Promise<void>
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
} {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    error: null,
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Defined with useRef so scheduleRefresh can reference it without circular deps
  const silentRefreshRef = useRef<() => Promise<void>>(async () => {})

  const scheduleRefresh = useCallback((token: string) => {
    const exp = getTokenExpiry(token)
    if (!exp) return
    const delay = exp * 1000 - Date.now() - 60_000   // fire 60s before expiry
    if (timerRef.current) clearTimeout(timerRef.current)
    if (delay <= 0) { silentRefreshRef.current(); return }
    timerRef.current = setTimeout(() => silentRefreshRef.current(), delay)
  }, [])

  useEffect(() => {
    silentRefreshRef.current = async () => {
      const rt = localStorage.getItem('refresh_token')
      if (!rt) return
      try {
        const r = await httpClient.post<{ access_token: string; refresh_token: string }>(
          '/auth/refresh', { refresh_token: rt }, { includeAuth: false },
        )
        localStorage.setItem('access_token', r.access_token)
        localStorage.setItem('refresh_token', r.refresh_token)
        const user = await getMe()
        setState(prev => ({ ...prev, isAuthenticated: true, user: enrichUser(user) }))
        scheduleRefresh(r.access_token)
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        document.cookie = 'ft-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        setState({ isLoading: false, isAuthenticated: false, user: null, error: null })
      }
    }
  }, [scheduleRefresh])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setState({ isLoading: false, isAuthenticated: false, user: null, error: null })
      return
    }

    getMe()
      .then(user => {
        setState({ isLoading: false, isAuthenticated: true, user: enrichUser(user), error: null })
        scheduleRefresh(token)
      })
      .catch(async () => {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          localStorage.removeItem('access_token')
          setState({ isLoading: false, isAuthenticated: false, user: null, error: null })
          return
        }
        try {
          const r = await httpClient.post<{ access_token: string; refresh_token: string }>(
            '/auth/refresh',
            { refresh_token: refreshToken },
            { includeAuth: false },
          )
          localStorage.setItem('access_token', r.access_token)
          localStorage.setItem('refresh_token', r.refresh_token)
          const user = await getMe()
          setState({ isLoading: false, isAuthenticated: true, user: enrichUser(user), error: null })
          scheduleRefresh(r.access_token)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          setState({ isLoading: false, isAuthenticated: false, user: null, error: null })
        }
      })

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [scheduleRefresh])

  const signIn = useCallback(async (_provider: 'google') => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      await signInWithGoogle()
    } catch (err) {
      setState(prev => ({ ...prev, isLoading: false, error: err instanceof Error ? err.message : 'Sign in failed' }))
      throw err
    }
  }, [])

  const signOut = useCallback(async () => {
    await apiSignOut().catch(() => {})
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    document.cookie = 'ft-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    setState({ isLoading: false, isAuthenticated: false, user: null, error: null })
  }, [])

  const refreshAuth = useCallback(async () => {
    if (!localStorage.getItem('access_token')) {
      setState(prev => ({ ...prev, isLoading: false, isAuthenticated: false, user: null }))
      return
    }
    try {
      const user = await getMe()
      setState(prev => ({ ...prev, isAuthenticated: true, user: enrichUser(user) }))
    } catch {
      localStorage.removeItem('access_token')
      setState(prev => ({ ...prev, isAuthenticated: false, user: null }))
    }
  }, [])

  return { ...state, signIn, signOut, refreshAuth }
}
