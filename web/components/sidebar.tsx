'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Plane, LogOut, Menu, X, UploadCloud } from 'lucide-react'
import { useAuth } from '@/lib/hooks'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/dashboard', icon: Plane,      label: 'Trips',  disabled: false },
  { href: '/upload',    icon: UploadCloud, label: 'Upload', disabled: true  },
]

function SidebarContent({ onNav }: { onNav?: () => void }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut().catch(() => {})
    router.push('/login')
  }

  return (
    <div className="flex flex-col h-full">

      {/* ── Logo ─────────────────────────────────── */}
      <div className="px-5 h-14 flex items-center gap-2.5 border-b border-border/60 shrink-0">
        <div className="w-7 h-7 rounded-lg border border-amber-500/25 bg-amber-500/8 flex items-center justify-center shrink-0">
          <Plane className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <span className="font-data text-[11px] tracking-[0.3em] text-amber-500/70 uppercase">
          FlightTrackr
        </span>
      </div>

      {/* ── Navigation ───────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label, disabled }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <button
              key={href}
              disabled={disabled}
              onClick={() => { if (!disabled) { router.push(href); onNav?.() } }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                'font-data tracking-[0.08em]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
                active && !disabled
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                  : disabled
                  ? 'text-muted-foreground/35 cursor-not-allowed'
                  : 'text-foreground/60 hover:text-foreground hover:bg-white/5',
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', active && !disabled ? 'text-amber-400' : '')} />
              <span>{label}</span>
              {disabled && (
                <span className="ml-auto font-data text-[9px] tracking-[0.2em] text-muted-foreground/35 uppercase">
                  soon
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* ── User ─────────────────────────────────── */}
      <div className="px-3 pb-4 pt-2 border-t border-border/60">
        <div className="px-3 py-2 rounded-lg">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[10px] text-amber-300 font-bold shrink-0">
              {(user?.name ?? user?.email)?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-data text-xs text-foreground/80 truncate leading-tight">
                {user?.name ?? 'User'}
              </p>
              <p className="font-data text-[9px] text-muted-foreground/60 truncate leading-tight">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md font-data text-[11px] tracking-[0.08em] text-muted-foreground/60 hover:text-red-400 hover:bg-red-500/5 transition-colors"
          >
            <LogOut className="w-3 h-3 shrink-0" />
            Sign out
          </button>
        </div>
      </div>

    </div>
  )
}

export function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="md:hidden fixed top-3.5 left-4 z-50 w-8 h-8 rounded-lg border border-border/60 bg-background/90 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-30 w-56 border-r border-border/60 bg-background/95 backdrop-blur-md">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <aside className={cn(
        'md:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col',
        'border-r border-border/60 bg-background/95 backdrop-blur-md',
        'transition-transform duration-200 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent onNav={() => setOpen(false)} />
      </aside>
    </>
  )
}
