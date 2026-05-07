'use client'

import { createContext, useContext } from 'react'
import type { GmailSyncState } from '@/lib/types'

interface GmailSyncContextValue {
  syncState: GmailSyncState
  isFirstSync: boolean
  initialized: boolean
  startSync: () => () => void
  resetSync: () => void
}

export const GmailSyncContext = createContext<GmailSyncContextValue | null>(null)

export function useGmailSyncContext(): GmailSyncContextValue {
  const ctx = useContext(GmailSyncContext)
  if (!ctx) throw new Error('useGmailSyncContext must be used inside DashboardLayout')
  return ctx
}
