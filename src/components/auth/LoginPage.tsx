'use client'

import React, { useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Eye, EyeOff, Mail, Lock, ArrowRight, Zap, Shield, Globe, Car,
  Sun, Moon, AlertCircle, Loader2, KeyRound,
  ChevronRight, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'server'
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (ctx) { ctx.textBaseline = 'top'; ctx.font = '14px Arial'; ctx.fillText('FleetFlow-Device-ID', 2, 2) }
  const nav = navigator; const screen = window.screen
  const raw = [nav.userAgent, nav.language, screen.width + 'x' + screen.height, screen.colorDepth, new Date().getTimezoneOffset(), nav.hardwareConcurrency || 'na', (nav as any).deviceMemory || 'na', canvas.toDataURL().slice(-50)].join('||')
  let hash = 0
  for (let i = 0; i < raw.length; i++) { const char = raw.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash = hash & hash }
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
    e.preventDefault(); setError(''); setIsLoading(true)
    try {
      const fingerprint = getDeviceFingerprint()
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, deviceFingerprint: fingerprint }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      login(data.user, data.sessionToken, data.permissions, data.isDemo, data.deviceActivated)
      if (!data.deviceActivated) toast.warning('Device requires activation', { description: 'Please activate this device with your serial key.' })
      else toast.success('Welcome back!', { description: `Signed in as ${data.user.name}` })
    } catch { setError('Network error. Please check your connection.') }
    finally { setIsLoading(false) }
  }, [email, password, login])

  const handleDemoLogin = useCallback(async () => {
    setDemoLoading(true); setError('')
    try {
      const fingerprint = getDeviceFingerprint()
      const res = await fetch('/api/auth/demo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceFingerprint: fingerprint }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Demo login failed'); return }
      login(data.user, data.sessionToken, data.permissions, data.isDemo, data.deviceActivated)
      if (!data.deviceActivated) toast.warning('Device requires activation', { description: 'Please activate this device with your serial key.' })
      else toast.success('Welcome to FleetFlow OS Demo!', { description: 'You have view-only access to all modules.' })
    } catch { setError('Network error. Please check your connection.') }
    finally { setDemoLoading(false) }
  }, [login])

  const features = [
    { icon: Car, label: 'Fleet Management', desc: 'Track & manage vehicles', color: 'text-chart-1' },
    { icon: Globe, label: 'GPS Tracking', desc: 'Real-time location', color: 'text-chart-2' },
    { icon: Shield, label: 'Compliance', desc: 'Insurance & regulations', color: 'text-chart-3' },
    { icon: Zap, label: 'AI Powered', desc: 'Smart analytics', color: 'text-chart-4' },
  ]

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — Branding with Solid Colors */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-[#1c1c1e]">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-chart-3/10" />
        
        {/* Floating orbs */}
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          className="absolute top-24 left-16 w-40 h-40 bg-primary/25 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 15, 0], x: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
          className="absolute bottom-32 right-16 w-56 h-56 bg-chart-2/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-chart-3/15 rounded-full blur-3xl"
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-lg tahoe-glow"
              >
                FF
              </motion.div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">FleetFlow OS</h2>
                <p className="text-xs text-white/50">Enterprise Fleet Management</p>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl xl:text-[3.25rem] font-bold leading-[1.1] mb-5 text-white">
              Manage Your Fleet
              <br />
              <span className="bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">Like Never Before</span>
            </h1>
            <p className="text-base text-white/60 mb-12 max-w-md leading-relaxed">
              Complete ERP platform for vehicle rental companies, fleet operators, transport & logistics providers.
            </p>

            {/* Feature Cards — Solid Dark Cards */}
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                  whileHover={{ y: -2, scale: 1.02 }}
                  className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white/8 border border-white/10 cursor-default"
                >
                  <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 shrink-0", feature.color)}>
                    <feature.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{feature.label}</p>
                    <p className="text-[10px] text-white/45">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mt-10 pt-8 border-t border-white/10">
              {[
                { value: '10K+', label: 'Vehicles Managed' },
                { value: '500+', label: 'Companies Trust Us' },
                { value: '99.9%', label: 'Uptime' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-xl font-bold bg-gradient-to-r from-primary to-chart-1 bg-clip-text text-transparent">{stat.value}</p>
                  <p className="text-[10px] text-white/45">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16">
        <div className="w-full max-w-sm mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground font-bold text-sm tahoe-glow">FF</div>
              <span className="font-bold text-sm">FleetFlow OS</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="ml-auto h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </motion.button>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            {/* Welcome */}
            <div className="mb-7">
              <h2 className="text-xl font-bold tracking-tight">Welcome back</h2>
              <p className="text-[13px] text-muted-foreground mt-1">Sign in to your FleetFlow OS account</p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mb-4">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[13px]">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email" type="email" placeholder="you@company.com"
                    value={email} onChange={(e) => { setEmail(e.target.value); setError('') }}
                    className="pl-10 h-10 rounded-xl bg-secondary border-border focus:bg-background transition-colors"
                    required autoComplete="email" disabled={isLoading || demoLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[13px] font-medium">Password</Label>
                  <button type="button" className="text-[11px] text-primary hover:underline font-medium">Forgot password?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password"
                    value={password} onChange={(e) => { setPassword(e.target.value); setError('') }}
                    className="pl-10 pr-10 h-10 rounded-xl bg-secondary border-border focus:bg-background transition-colors"
                    required autoComplete="current-password" disabled={isLoading || demoLoading}
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </motion.button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} disabled={isLoading || demoLoading} />
                <Label htmlFor="remember" className="text-[12px] text-muted-foreground font-normal cursor-pointer">Keep me signed in</Label>
              </div>

              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                <Button
                  type="submit" className="w-full h-10 font-semibold gap-2 rounded-xl"
                  disabled={isLoading || demoLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                  ) : (
                    <><span>Sign In</span><ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </motion.div>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-3 text-[11px] text-muted-foreground font-medium">OR</span></div>
            </div>

            {/* Demo Login — Solid Card */}
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleDemoLogin}
              disabled={isLoading || demoLoading}
              className={cn(
                "w-full relative overflow-hidden rounded-xl p-4 transition-all duration-300",
                "bg-card border border-border retina-shadow",
                "hover:border-primary/30 hover:tahoe-glow",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              <div className="relative flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[13px]">Try Demo Account</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-[9px] font-bold text-primary">VIEW ONLY</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Explore all features with read-only access</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
              {demoLoading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-xl">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
            </motion.button>

            {/* Info */}
            <div className="mt-4 p-3 rounded-xl bg-secondary border border-border">
              <div className="flex items-start gap-2">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="text-[11px] text-muted-foreground space-y-0.5">
                  <p><span className="font-medium text-foreground">Demo access:</span> View-only mode. No data can be modified.</p>
                  <p><span className="font-medium text-foreground">New device?</span> Serial key required to activate ERP.</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-5 border-t border-border">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
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
