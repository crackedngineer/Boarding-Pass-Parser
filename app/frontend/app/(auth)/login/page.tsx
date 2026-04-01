"use client"

import { AuthForm } from "@/components/auth-form"
import { Plane, Sparkles } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="w-full space-y-8">
      {/* Modern brand header */}
      <div className="text-center space-y-2">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-white/20 backdrop-blur-xl rounded-2xl" />
          <div className="relative flex items-center gap-3 px-6 py-4">
            <div className="relative">
              <div className="absolute inset-0 bg-white/30 rounded-xl blur-sm" />
              <div className="relative flex size-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <Plane className="size-7 text-white" />
              </div>
            </div>
            <div className="space-y-0 text-left">
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                FlightTrackr
                <Sparkles className="size-5 text-yellow-300" />
              </h1>
              <p className="text-sm text-white/80 font-medium">Track your journey</p>
            </div>
          </div>
        </div>
      </div>
      <AuthForm />
    </div>
  )
}
