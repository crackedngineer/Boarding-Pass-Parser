'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { Plane } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(isAuthenticated ? '/dashboard' : '/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-3">
        <Plane className="w-7 h-7 text-amber-400 animate-pulse" />
        <p className="font-data text-[10px] tracking-[0.35em] text-muted-foreground uppercase">
          Loading…
        </p>
      </div>
    </div>
  );
}
