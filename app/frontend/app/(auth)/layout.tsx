/**
 * Auth layout component.
 * Provides a modern centered layout for authentication pages.
 */

import { Button } from "@/components/ui/button";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-blue-600" />
      <div className="absolute inset-0 bg-gradient-to-tl from-cyan-400 via-blue-500 to-indigo-600 opacity-70" />
      
      {/* Animated background shapes */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-2000" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {children}
          
          {/* Modern footer */}
          <div className="text-center space-y-3">
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <p className="text-xs text-white/70 leading-relaxed">
              By continuing, you agree to our{' '}
              <Button variant="link" className="p-0 h-auto text-xs text-white/90 hover:text-white underline-offset-2">
                Terms of Service
              </Button>{' '}
              and{' '}
              <Button variant="link" className="p-0 h-auto text-xs text-white/90 hover:text-white underline-offset-2">
                Privacy Policy
              </Button>
            </p>
            <p className="text-xs text-white/50">
              © 2026 FlightTrackr. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}