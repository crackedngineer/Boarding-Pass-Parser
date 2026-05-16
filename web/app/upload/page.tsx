'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plane, UploadCloud, CheckCircle, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react'
import { useAuth } from '@/lib/hooks'
import { useBoardingPass } from '@/lib/hooks/useBoardingPass'
import { BoardingPassTicket } from '@/components/boarding-pass-ticket'
import { cn } from '@/lib/utils'

export default function UploadPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { status, flights, error, upload, reset } = useBoardingPass()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  const handleFiles = useCallback((files: FileList | null) => {
    const file = files?.[0]
    if (file) upload(file)
  }, [upload])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const onDragLeave = useCallback(() => setDragging(false), [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Plane className="w-6 h-6 text-amber-400 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-data text-[11px] tracking-[0.3em] text-amber-500/70 uppercase">
          Upload
        </h1>
        <p className="font-data text-sm text-muted-foreground">
          Add a boarding pass PDF to your trips
        </p>
      </div>

      {/* ── Idle / Drop zone ─────────────────────────────────── */}
      {status === 'idle' && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'relative flex flex-col items-center justify-center gap-4',
            'rounded-2xl border-2 border-dashed cursor-pointer',
            'px-8 py-16 transition-all duration-200 text-center',
            dragging
              ? 'border-amber-500/60 bg-amber-500/8'
              : 'border-border/60 bg-card hover:border-amber-500/30 hover:bg-amber-500/4',
          )}
        >
          <div className={cn(
            'w-14 h-14 rounded-2xl border flex items-center justify-center transition-colors',
            dragging
              ? 'border-amber-500/40 bg-amber-500/15'
              : 'border-border/60 bg-muted/20',
          )}>
            <UploadCloud className={cn(
              'w-6 h-6 transition-colors',
              dragging ? 'text-amber-400' : 'text-muted-foreground/60',
            )} />
          </div>

          <div>
            <p className="font-data text-sm font-medium text-foreground/80">
              {dragging ? 'Drop to upload' : 'Drop your boarding pass PDF'}
            </p>
            <p className="font-data text-[11px] text-muted-foreground mt-1">
              or click to browse · PDF only · max 5 MB
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            onChange={e => handleFiles(e.target.files)}
          />
        </div>
      )}

      {/* ── Uploading ─────────────────────────────────────────── */}
      {status === 'uploading' && (
        <div className="flex flex-col items-center justify-center gap-5 py-20 rounded-2xl border border-border/60 bg-card">
          <Plane className="w-8 h-8 text-amber-400 animate-pulse" />
          <div className="text-center">
            <p className="font-data text-sm text-foreground/80">Parsing your boarding pass…</p>
            <p className="font-data text-[11px] text-muted-foreground mt-1">This only takes a moment</p>
          </div>
        </div>
      )}

      {/* ── Success ───────────────────────────────────────────── */}
      {status === 'success' && flights.length > 0 && (
        <div className="space-y-6 animate-reveal-up">
          {/* Status banner */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/8">
            <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="font-data text-sm text-amber-300">
              Boarding pass added to your trips
            </p>
          </div>

          {/* Boarding pass ticket(s) */}
          {flights.map(flight => (
            <BoardingPassTicket
              key={flight.id}
              flight={flight}
              variant={flight.status === 'upcoming' ? 'upcoming' : 'completed'}
            />
          ))}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm font-data tracking-[0.1em] hover:bg-amber-500/25 transition-colors"
            >
              View all trips
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={reset}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border/60 text-muted-foreground text-sm font-data tracking-[0.1em] hover:text-foreground hover:border-border transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Upload another
            </button>
          </div>
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────── */}
      {status === 'error' && (
        <div className="space-y-5">
          <div className="flex flex-col items-center justify-center gap-4 py-16 rounded-2xl border border-border/60 bg-card text-center">
            <div className="w-12 h-12 rounded-2xl border border-red-500/20 bg-red-500/8 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="font-data text-sm font-medium text-foreground/80">
                Could not parse this boarding pass
              </p>
              {error && (
                <p className="font-data text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                  {error}
                </p>
              )}
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm font-data tracking-[0.1em] hover:bg-amber-500/25 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
