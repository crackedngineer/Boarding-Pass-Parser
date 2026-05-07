"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storeGoogleToken } from '@/lib/api/auth-service';
import { Loader2, CheckCircle, XCircle, Plane } from 'lucide-react';

type Status = 'loading' | 'success' | 'error';

const CONFIG: Record<Status, { icon: typeof Loader2; iconCls: string; title: string; borderCls: string }> = {
  loading: { icon: Loader2,      iconCls: 'text-amber-400 animate-spin', title: 'Authenticating…',      borderCls: 'border-amber-500/20' },
  success: { icon: CheckCircle,  iconCls: 'text-emerald-400',            title: 'Welcome!',              borderCls: 'border-emerald-500/20' },
  error:   { icon: XCircle,      iconCls: 'text-red-400',                title: 'Authentication Failed', borderCls: 'border-red-500/20' },
};

// Implicit flow: Supabase delivers all tokens in the URL hash fragment
function parseImplicitCallback() {
  if (typeof window === 'undefined') return { accessToken: null, refreshToken: null, providerRefreshToken: null, providerToken: null, errorMsg: null };
  const h = new URLSearchParams(window.location.hash.slice(1));
  const q = new URLSearchParams(window.location.search);
  const error = h.get('error') ?? q.get('error');
  if (error) return { accessToken: null, refreshToken: null, providerRefreshToken: null, providerToken: null, errorMsg: h.get('error_description') ?? q.get('error_description') ?? error };
  const accessToken = h.get('access_token');
  if (!accessToken) return { accessToken: null, refreshToken: null, providerRefreshToken: null, providerToken: null, errorMsg: 'No access token received' };
  return {
    accessToken,
    refreshToken: h.get('refresh_token'),
    providerRefreshToken: h.get('provider_refresh_token'),  // Google refresh token
    providerToken: h.get('provider_token'),                 // Google access token
    errorMsg: null,
  };
}

export default function CallbackPage() {
  const [status, setStatus] = useState<Status>(() => {
    const { accessToken, errorMsg } = parseImplicitCallback();
    return errorMsg || !accessToken ? 'error' : 'loading';
  });
  const [message, setMessage] = useState(() => {
    const { accessToken, errorMsg } = parseImplicitCallback();
    if (errorMsg) return errorMsg;
    if (!accessToken) return 'No access token received';
    return 'Verifying your identity…';
  });
  const router = useRouter();

  useEffect(() => {
    const { accessToken, refreshToken, providerRefreshToken, providerToken, errorMsg } = parseImplicitCallback();

    if (errorMsg || !accessToken) {
      const t = setTimeout(() => router.replace('/login'), 3000);
      return () => clearTimeout(t);
    }

    // Store Supabase session tokens
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    // Flag cookie for middleware — presence only, not the JWT
    document.cookie = 'ft-auth=1; path=/; SameSite=Lax';

    // Send Google tokens to backend (fire-and-forget — non-fatal)
    if (providerRefreshToken) {
      
      storeGoogleToken(providerRefreshToken, providerToken).catch(err =>
        console.warn('store-google-token failed:', err)
      );
    }

    let cancelled = false;
    const t1 = setTimeout(() => { if (!cancelled) setStatus('success'); }, 100);
    const t2 = setTimeout(() => router.replace('/dashboard'), 1100);
    return () => { cancelled = true; clearTimeout(t1); clearTimeout(t2); };
  }, [router]);

  const { icon: Icon, iconCls, title, borderCls } = CONFIG[status];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-dot-grid opacity-[0.12]" />
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] via-transparent to-blue-900/[0.06]" />

      <div className={`relative z-10 w-full max-w-sm mx-4 rounded-2xl border ${borderCls} bg-card/60 backdrop-blur-md p-8 text-center space-y-6`}>

        <div className="flex items-center justify-center gap-2">
          <div className="w-7 h-7 rounded-lg border border-amber-500/25 bg-amber-500/8 flex items-center justify-center">
            <Plane className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="font-data text-[11px] tracking-[0.35em] text-amber-500/60 uppercase">FlightTrackr</span>
        </div>

        <Icon className={`w-8 h-8 mx-auto ${iconCls}`} />

        <div>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          <p className="font-data text-[11px] tracking-[0.06em] text-muted-foreground mt-2 leading-relaxed">
            {message}
          </p>
        </div>

        {status === 'loading' && (
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1 h-1 rounded-full bg-amber-400/50 animate-pulse"
                style={{ animationDelay: `${i * 180}ms` }} />
            ))}
          </div>
        )}

        {status === 'error' && (
          <p className="font-data text-[10px] tracking-[0.2em] text-muted-foreground/40 uppercase">
            Redirecting to login…
          </p>
        )}
      </div>
    </div>
  );
}