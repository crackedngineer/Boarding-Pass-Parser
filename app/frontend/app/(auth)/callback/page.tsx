"use client";

/**
 * OAuth callback page.
 * Handles the OAuth callback flow and redirects users after authentication.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function CallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');
  const router = useRouter();
  const { refreshAuth } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract auth code or token from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(`Authentication error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Refresh auth state to pick up the new session
        await refreshAuth();

        setStatus('success');
        setMessage('Authentication successful! Redirecting...');

        // Redirect to dashboard after successful auth
        setTimeout(() => {
          router.replace('/dashboard');
        }, 1500);

      } catch (error) {
        console.error('Authentication callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Authentication failed');

        // Redirect to login after error
        setTimeout(() => {
          router.replace('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [router, refreshAuth]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>
        <CardTitle>
          {status === 'loading' && 'Authenticating...'}
          {status === 'success' && 'Welcome!'}
          {status === 'error' && 'Authentication Failed'}
        </CardTitle>
        <CardDescription>
          {message}
        </CardDescription>
      </CardHeader>
      {status === 'error' && (
        <CardContent className="text-center">
          <p className="text-sm text-gray-600">
            You will be redirected to the login page shortly.
          </p>
        </CardContent>
      )}
    </Card>
  );
}