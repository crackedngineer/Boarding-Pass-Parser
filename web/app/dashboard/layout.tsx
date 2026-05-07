'use client'

import { useGmailSync } from '@/lib/hooks'
import { GmailSyncContext } from '@/lib/context/gmail-sync-context'
import { Sidebar } from '@/components/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const gmailSync = useGmailSync()

  return (
    <GmailSyncContext.Provider value={gmailSync}>
      {/* Background shared across all dashboard routes */}
      <div className="fixed inset-0 bg-dot-grid opacity-20 pointer-events-none z-0" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full bg-amber-500/4 blur-[100px] pointer-events-none z-0" />

      <Sidebar />

      {/* Offset by sidebar width on desktop; top-pad on mobile for hamburger */}
      <main className="relative z-10 min-h-screen md:pl-56 pt-14 md:pt-0">
        {children}
      </main>
    </GmailSyncContext.Provider>
  )
}
