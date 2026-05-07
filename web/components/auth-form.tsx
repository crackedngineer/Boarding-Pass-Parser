'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks';

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function AuthForm() {
  const { signIn, isLoading } = useAuth();
  const [error, setError] = useState('');

  const handleGoogleAuth = async () => {
    setError('');
    try {
      await signIn('google');
      // OAuth redirect takes over — execution never continues past here
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleGoogleAuth}
        disabled={isLoading}
        className="group w-full flex items-center justify-center gap-3 h-12 px-6 rounded-xl
                   bg-white/5 border border-white/10
                   hover:bg-white/8 hover:border-amber-500/30
                   active:scale-[0.98]
                   transition-all duration-200
                   text-white text-sm font-medium
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
        ) : (
          <GoogleIcon />
        )}
        <span>{isLoading ? 'Connecting…' : 'Continue with Google'}</span>
      </button>

      {error && (
        <p className="font-data text-xs text-red-400 text-center leading-relaxed">{error}</p>
      )}

      <p className="text-xs text-center text-muted-foreground leading-relaxed">
        We&apos;ll request{' '}
        <span className="text-foreground/70">read-only Gmail access</span>
        {' '}to sync your boarding passes automatically.
      </p>
    </div>
  );
}
