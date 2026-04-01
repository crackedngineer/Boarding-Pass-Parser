/**
 * Reusable loading components for different scenarios.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8',
  };

  return (
    <Loader2 
      className={cn('animate-spin', sizeClasses[size], className)} 
    />
  );
}

interface LoadingPageProps {
  message?: string;
  className?: string;
}

export function LoadingPage({ message = 'Loading...', className }: LoadingPageProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center min-h-[400px] p-4', className)}>
      <LoadingSpinner size="lg" className="mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function LoadingButton({ 
  isLoading, 
  children, 
  className, 
  disabled,
  onClick 
}: LoadingButtonProps) {
  return (
    <button
      className={cn('inline-flex items-center', className)}
      disabled={disabled || isLoading}
      onClick={onClick}
    >
      {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({ isLoading, message = 'Loading...', children }: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-2">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
}