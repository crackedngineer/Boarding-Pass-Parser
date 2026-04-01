"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles, Shield } from 'lucide-react';

interface FormData {
  email: string;
  password: string;
  confirmPassword?: string;
  fullName?: string;
}

export function AuthForm() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signIn, isLoading } = useAuth();
  const router = useRouter();

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (isRegister: boolean): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (isRegister: boolean) => {
    if (!validateForm(isRegister)) return;

    try {
      if (isRegister) {
        alert('Registration functionality will be implemented soon!');
        return;
      }

      await signIn('google');
      router.push('/dashboard');
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Authentication failed'
      });
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await signIn('google');
      router.push('/dashboard');
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Google authentication failed'
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Enhanced Glass morphism container */}
      <div className="relative backdrop-blur-2xl bg-white/[0.08] rounded-3xl border border-white/[0.15] shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] overflow-hidden group">
        {/* Multiple gradient layers for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.06] to-transparent opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-tl from-blue-400/[0.08] via-transparent to-purple-400/[0.08]" />
        
        {/* Animated border glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/[0.15] via-purple-400/[0.15] to-pink-400/[0.15] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
        
        {/* Floating elements for depth */}
        <div className="absolute top-4 right-4 w-16 h-16 bg-white/[0.03] rounded-full blur-xl" />
        <div className="absolute bottom-8 left-4 w-20 h-20 bg-blue-400/[0.05] rounded-full blur-2xl animate-pulse" />
        
        <Tabs defaultValue="login" className="relative z-20 w-full">
          {/* Enhanced tab design */}
          <div className="p-2">
            <TabsList className="grid w-full grid-cols-2 bg-black/[0.08] backdrop-blur-md border border-white/[0.08] rounded-2xl p-1.5 h-14 shadow-inner">
              <TabsTrigger 
                value="login" 
                className="text-sm font-semibold text-white/70 data-[state=active]:bg-white/[0.12] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:backdrop-blur-sm rounded-xl transition-all duration-300 hover:text-white/90 hover:bg-white/[0.06]"
              >
                <Shield className="w-4 h-4 mr-2 transition-transform duration-200 data-[state=active]:scale-110" />
                Sign In
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="text-sm font-semibold text-white/70 data-[state=active]:bg-white/[0.12] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:backdrop-blur-sm rounded-xl transition-all duration-300 hover:text-white/90 hover:bg-white/[0.06]"
              >
                <Sparkles className="w-4 h-4 mr-2 transition-transform duration-200 data-[state=active]:scale-110" />
                Sign Up
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="login" className="px-7 pb-7 space-y-7">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-white drop-shadow-sm">Welcome Back</h2>
              <p className="text-white/60 text-sm leading-relaxed">Sign in to continue your journey with FlightTrackr</p>
            </div>

            {errors.submit && (
              <div className="p-4 rounded-2xl bg-red-500/[0.12] border border-red-400/[0.2] backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-red-200 text-center">{errors.submit}</p>
              </div>
            )}

            {/* Enhanced Google Sign-in Button */}
            <Button 
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full h-14 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] text-white backdrop-blur-md transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] hover:shadow-lg hover:border-white/20 font-medium rounded-2xl group"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              ) : (
                <div className="relative">
                  <svg className="w-5 h-5 mr-3 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                </div>
              )}
              Continue with Google
            </Button>
            {/* </Button>
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Continue with Google
            </Button> */}

            {/* Enhanced Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.15]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-6 py-2 bg-white/[0.08] backdrop-blur-md text-white/60 rounded-full border border-white/[0.12] shadow-sm">
                  Or continue with email
                </span>
              </div>
            </div>

            <div className="space-y-5">
              {/* Enhanced Email Field */}
              <div className="space-y-3">
                <Label htmlFor="login-email" className="text-white/80 font-medium text-sm block">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-4 h-5 w-5 text-white/40 group-focus-within:text-white/70 transition-colors duration-200" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-12 h-14 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md border-white/[0.15] hover:border-white/[0.25] focus:border-white/[0.35] text-white placeholder:text-white/40 focus:ring-white/[0.15] focus:ring-4 rounded-2xl transition-all duration-300 font-medium"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/[0.03] to-purple-400/[0.03] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-300 ml-1 animate-in slide-in-from-left-2 duration-200">{errors.email}</p>
                )}
              </div>

              {/* Enhanced Password Field */}
              <div className="space-y-3">
                <Label htmlFor="login-password" className="text-white/80 font-medium text-sm block">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-white/40 group-focus-within:text-white/70 transition-colors duration-200" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-12 pr-12 h-14 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md border-white/[0.15] hover:border-white/[0.25] focus:border-white/[0.35] text-white placeholder:text-white/40 focus:ring-white/[0.15] focus:ring-4 rounded-2xl transition-all duration-300 font-medium"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 h-5 w-5 text-white/40 hover:text-white/80 transition-all duration-200 hover:scale-110"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/[0.03] to-purple-400/[0.03] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-300 ml-1 animate-in slide-in-from-left-2 duration-200">{errors.password}</p>
                )}
              </div>

              {/* Enhanced Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-3">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    id="remember"
                    type="checkbox"
                    className="w-4 h-4 rounded bg-white/[0.08] border-white/[0.2] text-blue-500 focus:ring-blue-400/[0.25] focus:ring-offset-0 transition-all"
                  />
                  <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">Remember me</span>
                </label>
                <Button variant="link" className="p-0 h-auto text-sm text-white/60 hover:text-white/90 transition-colors duration-200">
                  Forgot password?
                </Button>
              </div>

              {/* Enhanced Sign In Button */}
              <Button 
                onClick={() => handleSubmit(false)}
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-blue-600/80 via-purple-600/80 to-pink-600/80 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold rounded-2xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg hover:shadow-xl hover:shadow-purple-500/[0.15] backdrop-blur-sm border border-white/[0.1] group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/[0.1] via-transparent to-white/[0.1] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center justify-center">
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : null}
                  Sign In to FlightTrackr
                </div>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="register" className="px-7 pb-7 space-y-7">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-bold text-white drop-shadow-sm">Join FlightTrackr</h2>
              <p className="text-white/60 text-sm leading-relaxed">Create your account and start tracking flights effortlessly</p>
            </div>

            {errors.submit && (
              <div className="p-4 rounded-2xl bg-red-500/[0.12] border border-red-400/[0.2] backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
                <p className="text-sm text-red-200 text-center">{errors.submit}</p>
              </div>
            )}

            {/* Enhanced Google Sign-up Button */}
            <Button 
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="w-full h-14 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] text-white backdrop-blur-md transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] hover:shadow-lg hover:border-white/20 font-medium rounded-2xl group"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              ) : (
                <div className="relative">
                  <svg className="w-5 h-5 mr-3 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                </div>
              )}
              Sign up with Google
            </Button>

            {/* Enhanced Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.15]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-6 py-2 bg-white/[0.08] backdrop-blur-md text-white/60 rounded-full border border-white/[0.12] shadow-sm">
                  Or create account with email
                </span>
              </div>
            </div>

            <div className="space-y-5">
              {/* Enhanced Name Field */}
              <div className="space-y-3">
                <Label htmlFor="register-name" className="text-white/80 font-medium text-sm block">Full Name</Label>
                <div className="relative group">
                  {/* <User className="absolute left-4 top-4 h-5 w-5 text-white/40 group-focus-within:text-white/70 transition-colors duration-200" /> */}
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pl-12 h-14 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md border-white/[0.15] hover:border-white/[0.25] focus:border-white/[0.35] text-white placeholder:text-white/40 focus:ring-white/[0.15] focus:ring-4 rounded-2xl transition-all duration-300 font-medium"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/[0.03] to-purple-400/[0.03] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                {errors.name && (
                  <p className="text-sm text-red-300 ml-1 animate-in slide-in-from-left-2 duration-200">{errors.name}</p>
                )}
              </div>

              {/* Enhanced Email Field */}
              <div className="space-y-3">
                <Label htmlFor="register-email" className="text-white/80 font-medium text-sm block">Email Address</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-4 h-5 w-5 text-white/40 group-focus-within:text-white/70 transition-colors duration-200" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-12 h-14 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md border-white/[0.15] hover:border-white/[0.25] focus:border-white/[0.35] text-white placeholder:text-white/40 focus:ring-white/[0.15] focus:ring-4 rounded-2xl transition-all duration-300 font-medium"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/[0.03] to-purple-400/[0.03] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-300 ml-1 animate-in slide-in-from-left-2 duration-200">{errors.email}</p>
                )}
              </div>

              {/* Enhanced Password Field */}
              <div className="space-y-3">
                <Label htmlFor="register-password" className="text-white/80 font-medium text-sm block">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-white/40 group-focus-within:text-white/70 transition-colors duration-200" />
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-12 pr-12 h-14 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md border-white/[0.15] hover:border-white/[0.25] focus:border-white/[0.35] text-white placeholder:text-white/40 focus:ring-white/[0.15] focus:ring-4 rounded-2xl transition-all duration-300 font-medium"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 h-5 w-5 text-white/40 hover:text-white/80 transition-all duration-200 hover:scale-110"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/[0.03] to-purple-400/[0.03] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-300 ml-1 animate-in slide-in-from-left-2 duration-200">{errors.password}</p>
                )}
              </div>

              {/* Enhanced Confirm Password Field */}
              <div className="space-y-3">
                <Label htmlFor="confirm-password" className="text-white/80 font-medium text-sm block">Confirm Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-4 h-5 w-5 text-white/40 group-focus-within:text-white/70 transition-colors duration-200" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="pl-12 pr-12 h-14 bg-white/[0.04] hover:bg-white/[0.08] backdrop-blur-md border-white/[0.15] hover:border-white/[0.25] focus:border-white/[0.35] text-white placeholder:text-white/40 focus:ring-white/[0.15] focus:ring-4 rounded-2xl transition-all duration-300 font-medium"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/[0.03] to-purple-400/[0.03] opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-300 ml-1 animate-in slide-in-from-left-2 duration-200">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Enhanced Terms Checkbox */}
              <div className="pt-4">
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    id="terms"
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 rounded bg-white/[0.08] border-white/[0.2] text-blue-500 focus:ring-blue-400/[0.25] focus:ring-offset-0 transition-all"
                  />
                  <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors leading-relaxed">
                    I agree to the{" "}
                    <Button variant="link" className="p-0 h-auto text-sm text-blue-300 hover:text-blue-200 underline-offset-4">
                      Terms of Service
                    </Button>
                    {" "}and{" "}
                    <Button variant="link" className="p-0 h-auto text-sm text-blue-300 hover:text-blue-200 underline-offset-4">
                      Privacy Policy
                    </Button>
                  </span>
                </label>
              </div>

              {/* Enhanced Create Account Button */}
              <Button 
                onClick={() => handleSubmit(true)}
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-green-600/80 via-blue-600/80 to-purple-600/80 hover:from-green-500 hover:via-blue-500 hover:to-purple-500 text-white font-semibold rounded-2xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shadow-lg hover:shadow-xl hover:shadow-blue-500/[0.15] backdrop-blur-sm border border-white/[0.1] group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/[0.1] via-transparent to-white/[0.1] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center justify-center">
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" />
                  )}
                  Create FlightTrackr Account
                </div>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}