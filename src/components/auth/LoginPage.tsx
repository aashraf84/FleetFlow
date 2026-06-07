'use client'

import React, { useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Eye, EyeOff, Mail, Lock, ArrowRight, Zap, Shield, Globe, Car,
  Sun, Moon, Monitor, AlertCircle, Loader2, KeyRound,
  ChevronRight, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Generate a browser fingerprint
function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server'
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('FleetFlow-Device-ID', 2, 2)
  }
  const nav = navigator
  const screen = window.screen
  const raw = [
    nav.userAgent,
    nav.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    nav.hardwareConcurrency || 'na',
    (nav as any).deviceMemory || 'na',
    canvas.toDataURL().slice(-50),
  ].join('||')
  
  // Simple hash
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return 'FFD-' + Math.abs(hash).toString(36).toUpperCase().slice(0, 12)
}

export default function LoginPage() {
  const { login } = useAppStore()
  const { theme, setTheme } = useTheme()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoLoading, setDemoLoading] = useState(false)

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const fingerprint = getDeviceFingerprint()
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, deviceFingerprint: fingerprint }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      login(data.user, data.sessionToken, data.permissions, data.isDemo, data.deviceActivated)

      if (!data.deviceActivated) {
        toast.warning('Device requires activation', {
          description: 'Please activate this device with your serial key.',
        })
      } else {
        toast.success('Welcome back!', {
          description: `Signed in as ${data.user.name}`,
        })
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }, [email, password, login])

  const handleDemoLogin = useCallback(async () => {
    setDemoLoading(true)
    setError('')

    try {
      const fingerprint = getDeviceFingerprint()
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceFingerprint: fingerprint }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Demo login failed')
        return
      }

      login(data.user, data.sessionToken, data.permissions, data.isDemo, data.deviceActivated)

      if (!data.deviceActivated) {
        toast.warning('Device requires activation', {
          description: 'Please activate this device with your serial key.',
        })
      } else {
        toast.success('Welcome to FleetFlow OS Demo!', {
          description: 'You have view-only access to all modules.',
        })
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setDemoLoading(false)
    }
  }, [login])

  const features = [
    { icon: Car, label: 'Fleet Management', desc: 'Track & manage vehicles' },
    { icon: Globe, label: 'GPS Tracking', desc: 'Real-time location' },
    { icon: Shield, label: 'Compliance', desc: 'Insurance & regulations' },
    { icon: Zap, label: 'AI Powered', desc: 'Smart analytics' },
  ]

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/25">
                FF
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">FleetFlow OS</h2>
                <p className="text-sm text-muted-foreground">Enterprise Fleet Management</p>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">
              Manage Your Fleet
              <br />
              <span className="text-primary">Like Never Before</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-12 max-w-lg">
              Complete ERP platform for vehicle rental companies, fleet operators, transport & logistics providers.
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-4 max-w-md">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-3 p-4 rounded-xl bg-card/80 backdrop-blur border border-border/50 shadow-sm"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0">
                    <feature.icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{feature.label}</p>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mt-10 pt-8 border-t border-border/30">
              {[
                { value: '10K+', label: 'Vehicles Managed' },
                { value: '500+', label: 'Companies Trust Us' },
                { value: '99.9%', label: 'Uptime' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16">
        <div className="w-full max-w-md mx-auto">
          {/* Theme toggle */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                FF
              </div>
              <span className="font-bold">FleetFlow OS</span>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Welcome text */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                Sign in to your FleetFlow OS account to continue
              </p>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError('') }}
                    className="pl-10 h-11"
                    required
                    autoComplete="email"
                    disabled={isLoading || demoLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <button type="button" className="text-xs text-primary hover:underline font-medium">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    className="pl-10 pr-10 h-11"
                    required
                    autoComplete="current-password"
                    disabled={isLoading || demoLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading || demoLoading}
                />
                <Label htmlFor="remember" className="text-sm text-muted-foreground font-normal cursor-pointer">
                  Keep me signed in for 30 days
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-semibold gap-2"
                disabled={isLoading || demoLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <Separator />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-background px-3 text-xs text-muted-foreground font-medium">OR</span>
              </div>
            </div>

            {/* Demo Login */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <button
                onClick={handleDemoLogin}
                disabled={isLoading || demoLoading}
                className={cn(
                  "w-full group relative overflow-hidden rounded-lg border-2 border-dashed border-primary/30",
                  "p-4 transition-all duration-300",
                  "hover:border-primary hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/5",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Try Demo Account</span>
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium bg-primary/10 text-primary">
                        VIEW ONLY
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Explore all features with read-only access
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                {demoLoading && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </button>
            </motion.div>

            {/* Info about demo */}
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-start gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><span className="font-medium text-foreground">Demo access:</span> View-only mode across all modules. No data can be modified.</p>
                  <p><span className="font-medium text-foreground">New device?</span> You&apos;ll need a serial key to activate FleetFlow OS on this device.</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>&copy; {new Date().getFullYear()} FleetFlow OS</span>
                <div className="flex items-center gap-3">
                  <button className="hover:text-foreground transition-colors">Privacy</button>
                  <button className="hover:text-foreground transition-colors">Terms</button>
                  <button className="hover:text-foreground transition-colors">Support</button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
