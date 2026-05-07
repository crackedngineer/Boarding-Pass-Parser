'use client';

import { useState, useEffect, useCallback } from 'react';
import { GmailSyncState, GmailSyncStatus } from '@/lib/types';

const STORAGE_KEY = 'flighttrackr_gmail_sync';

type SyncStep = {
  status: GmailSyncStatus;
  delay: number;
  emails: number;
  passes: number;
};

const SYNC_STEPS: SyncStep[] = [
  { status: 'connecting', delay: 0,    emails: 0,   passes: 0 },
  { status: 'scanning',   delay: 1000, emails: 147, passes: 0 },
  { status: 'parsing',    delay: 2400, emails: 147, passes: 0 },
  { status: 'synced',     delay: 3800, emails: 147, passes: 5 },
];

export function useGmailSync() {
  const [syncState, setSyncState] = useState<GmailSyncState>({
    status: 'idle',
    lastSyncedAt: null,
    emailsScanned: 0,
    boardingPassesFound: 0,
    error: null,
  });
  const [isFirstSync, setIsFirstSync] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSyncState(JSON.parse(stored) as GmailSyncState);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setIsFirstSync(true);
      }
    } else {
      setIsFirstSync(true);
    }
    setInitialized(true);
  }, []);

  const startSync = useCallback(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    SYNC_STEPS.forEach(({ status, delay, emails, passes }) => {
      const t = setTimeout(() => {
        setSyncState(prev => {
          const next: GmailSyncState = {
            ...prev,
            status,
            emailsScanned:       emails > 0 ? emails : prev.emailsScanned,
            boardingPassesFound: passes > 0 ? passes : prev.boardingPassesFound,
            lastSyncedAt:        status === 'synced' ? new Date().toISOString() : prev.lastSyncedAt,
            error: null,
          };
          if (status === 'synced' && typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            setIsFirstSync(false);
          }
          return next;
        });
      }, delay);
      timers.push(t);
    });

    // Return cleanup so callers can cancel in-flight timers on unmount
    return () => { timers.forEach(clearTimeout); };
  }, []);

  const resetSync = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setSyncState({
      status: 'idle',
      lastSyncedAt: null,
      emailsScanned: 0,
      boardingPassesFound: 0,
      error: null,
    });
    setIsFirstSync(true);
  }, []);

  return { syncState, isFirstSync, initialized, startSync, resetSync };
}
