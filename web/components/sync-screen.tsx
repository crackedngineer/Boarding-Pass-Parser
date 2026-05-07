'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plane, Mail, FileText, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GmailSyncStatus } from '@/lib/types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·—';

const STEPS: Array<{
  status: GmailSyncStatus;
  label: string;
  sublabel: string;
  Icon: React.ElementType;
}> = [
  { status: 'connecting', label: 'CONNECTING TO GMAIL',         sublabel: 'Establishing secure OAuth connection',  Icon: Mail },
  { status: 'scanning',   label: 'SCANNING INBOX',              sublabel: 'Reading email headers and subjects',    Icon: Mail },
  { status: 'parsing',    label: 'EXTRACTING BOARDING PASSES',  sublabel: 'Decoding BCBP barcodes from PDFs',      Icon: FileText },
  { status: 'synced',     label: 'SYNC COMPLETE',               sublabel: 'All your flights are loaded',           Icon: CheckCircle },
];

const ORDER: GmailSyncStatus[] = ['connecting', 'scanning', 'parsing', 'synced'];

function scramble(target: string, progress: number): string {
  return target
    .split('')
    .map((char, i) => {
      if (char === ' ') return ' ';
      if (progress > i / target.length) return char;
      return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    })
    .join('');
}

interface SyncScreenProps {
  syncStatus: GmailSyncStatus;
  emailsScanned: number;
  boardingPassesFound: number;
  onComplete: () => void;
}

export function SyncScreen({
  syncStatus,
  emailsScanned,
  boardingPassesFound,
  onComplete,
}: SyncScreenProps) {
  const [displayText, setDisplayText] = useState('');
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  const currentIdx = Math.max(0, ORDER.indexOf(syncStatus));
  const currentStep = STEPS[currentIdx];
  const isComplete = syncStatus === 'synced';

  // Scramble-reveal animation whenever the target text changes
  const animateText = useCallback((target: string) => {
    let frame = 0;
    const TOTAL_FRAMES = 22;
    const interval = setInterval(() => {
      frame++;
      const progress = frame / TOTAL_FRAMES;
      setDisplayText(scramble(target, progress));
      if (frame >= TOTAL_FRAMES) {
        clearInterval(interval);
        setDisplayText(target);
      }
    }, 45);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!currentStep) return;
    return animateText(currentStep.label);
  }, [currentStep?.label, animateText]);

  // Fade out when done
  useEffect(() => {
    if (!isComplete) return;
    const fadeTimer = setTimeout(() => setExiting(true), 900);
    const doneTimer = setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 1400);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [isComplete, onComplete]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="Syncing your Gmail flights"
      aria-live="polite"
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500',
        exiting ? 'opacity-0 pointer-events-none' : 'opacity-100',
      )}
    >
      {/* Dot grid background */}
      <div className="absolute inset-0 bg-dot-grid opacity-40" />

      {/* Amber atmospheric glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-amber-500/5 blur-[80px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-10 px-8 max-w-lg w-full text-center">

        {/* Logo mark */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl border border-amber-500/25 bg-amber-500/8 flex items-center justify-center">
            <Plane className="w-5 h-5 text-amber-400" />
          </div>
          <span className="font-data text-xs tracking-[0.35em] text-amber-500/60 uppercase select-none">
            FlightTrackr
          </span>
        </div>

        {/* Flip-board display */}
        <div className="w-full scanline-overlay">
          <div className="bg-card border border-border/70 rounded-xl px-8 py-6 shadow-2xl">
            {/* Current step icon */}
            <div className="flex justify-center mb-4">
              <currentStep.Icon
                className={cn(
                  'w-8 h-8 transition-colors duration-300',
                  isComplete ? 'text-amber-400' : 'text-muted-foreground',
                )}
              />
            </div>

            {/* Scramble text */}
            <div
              aria-live="assertive"
              aria-atomic="true"
              className="font-data text-xl sm:text-2xl font-medium tracking-[0.12em] text-white min-h-[2rem] leading-none"
            >
              <span aria-label={currentStep?.label}>{displayText || currentStep?.label}</span>
              <span aria-hidden="true" className="animate-cursor text-amber-400 ml-0.5">_</span>
            </div>

            {/* Sublabel */}
            <p className="text-muted-foreground text-sm mt-3 font-sans">
              {currentStep?.sublabel}
            </p>
          </div>
        </div>

        {/* Step progress indicators */}
        <div className="flex items-center justify-center gap-1.5">
          {STEPS.map((step, i) => {
            const isDone   = i < currentIdx || isComplete;
            const isActive = i === currentIdx && !isComplete;
            return (
              <div key={step.status} className="flex items-center gap-1.5">
                <div
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-500',
                    isDone   ? 'w-6 bg-amber-500'              : '',
                    isActive ? 'w-6 bg-amber-500/70 animate-pulse' : '',
                    !isDone && !isActive ? 'w-3 bg-border'     : '',
                  )}
                />
              </div>
            );
          })}
        </div>

        {/* Live stats */}
        {emailsScanned > 0 && (
          <div className="flex gap-10 animate-reveal-up">
            <div className="text-center">
              <div className="font-data text-2xl font-medium text-amber-400 tabular-nums">
                {emailsScanned}
              </div>
              <div className="font-data text-[11px] tracking-[0.2em] text-muted-foreground uppercase mt-0.5">
                Emails scanned
              </div>
            </div>
            {boardingPassesFound > 0 && (
              <div className="text-center">
                <div className="font-data text-2xl font-medium text-amber-400 tabular-nums">
                  {boardingPassesFound}
                </div>
                <div className="font-data text-[11px] tracking-[0.2em] text-muted-foreground uppercase mt-0.5">
                  Passes found
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
