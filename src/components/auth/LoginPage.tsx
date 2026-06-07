'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, EyeOff, ArrowRight, Loader2, KeyRound,
  ChevronRight, Sparkles, Power, RotateCw, Moon, Sun
} from 'lucide-react'
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

// ============================================
// macOS Mojave Clock Component
// ============================================
function MojaveClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const timeString = time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const dateString = time.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="text-center select-none">
      <p className="text-6xl sm:text-7xl font-extralight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
        {timeString}
      </p>
      <p className="text-lg sm:text-xl font-light text-white/80 mt-1 drop-shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
        {dateString}
      </p>
    </div>
  )
}

// ============================================
// macOS Mojave Login Page
// ============================================
export default function LoginPage() {
  const { login } = useAppStore()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoLoading, setDemoLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)

  // Wait for mount to avoid hydration mismatch with theme
  useEffect(() => { setMounted(true) }, [])

  // Show the form after a brief delay (Mojave-style appear animation)
  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => setShowForm(true), 400)
      return () => clearTimeout(timer)
    }
  }, [mounted])

  const isDark = resolvedTheme === 'dark'

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

  if (!mounted) {
    return (
      <div className="min-h-screen mojave-wallpaper-light flex items-center justify-center">
        <div className="animate-pulse flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl">
          <div className="w-8 h-8 rounded-full bg-white/40" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* ============================================
          Mojave Wallpaper Background
          ============================================ */}
      <div className="absolute inset-0 -z-10">
        {/* Animated wallpaper */}
        <div
          className={cn(
            "absolute inset-[-5%] animate-mojave-wallpaper",
            isDark ? "mojave-wallpaper-dark" : "mojave-wallpaper-light"
          )}
        />

        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }} />

        {/* Soft vignette */}
        <div className={cn(
          "absolute inset-0",
          isDark
            ? "bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.5)_100%)]"
            : "bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.15)_100%)]"
        )} />
      </div>

      {/* ============================================
          Top Section — Clock (Mojave Style)
          ============================================ */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Clock */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <MojaveClock />
        </motion.div>

        {/* ============================================
            User Avatar — Mojave Circle
            ============================================ */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center"
            >
              {/* Avatar Circle */}
              <div className="relative">
                <div
                  className={cn(
                    "w-24 h-24 rounded-full flex items-center justify-center",
                    "mojave-frost mojave-frost-light",
                    "retina-shadow-lg",
                    inputFocused && "animate-mojave-pulse"
                  )}
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-foreground">FF</span>
                  </div>
                </div>
                {/* Online indicator */}
                <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-[2.5px] border-white dark:border-gray-800 shadow-sm" />
              </div>

              {/* User Name */}
              <h2 className="mt-4 text-xl font-semibold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
                FleetFlow OS
              </h2>
              <p className="text-sm text-white/70 mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
                Enterprise Fleet Management
              </p>

              {/* ============================================
                  Login Form — Mojave Centered Card
                  ============================================ */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 w-full max-w-[340px]"
              >
                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      className="mb-4 overflow-hidden"
                    >
                      <div className={cn(
                        "flex items-center gap-2 px-4 py-3 rounded-2xl text-sm",
                        "mojave-frost mojave-frost-light",
                        "text-red-600 dark:text-red-400"
                      )}>
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <span>{error}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Login Card — Frosted Glass */}
                <div className={cn(
                  "rounded-2xl p-6 mojave-frost mojave-frost-light",
                  "retina-shadow-lg"
                )}>
                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Email Input */}
                    <div>
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError('') }}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        className={cn(
                          "w-full h-11 px-4 rounded-xl text-sm outline-none transition-all duration-200",
                          "mojave-frost-input mojave-frost-input-light",
                          "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                          "text-gray-900 dark:text-gray-100",
                          "focus:ring-2 focus:ring-primary/40 focus:bg-white/70 dark:focus:bg-gray-800/70"
                        )}
                        required
                        autoComplete="email"
                        disabled={isLoading || demoLoading}
                      />
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError('') }}
                        onFocus={() => setInputFocused(true)}
                        onBlur={() => setInputFocused(false)}
                        className={cn(
                          "w-full h-11 px-4 pr-11 rounded-xl text-sm outline-none transition-all duration-200",
                          "mojave-frost-input mojave-frost-input-light",
                          "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                          "text-gray-900 dark:text-gray-100",
                          "focus:ring-2 focus:ring-primary/40 focus:bg-white/70 dark:focus:bg-gray-800/70"
                        )}
                        required
                        autoComplete="current-password"
                        disabled={isLoading || demoLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Sign In Button */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading || demoLoading}
                      className={cn(
                        "w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200",
                        "bg-primary text-primary-foreground",
                        "hover:bg-primary/90",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "flex items-center justify-center gap-2"
                      )}
                    >
                      {isLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                      ) : (
                        <>Sign In <ArrowRight className="h-4 w-4" /></>
                      )}
                    </motion.button>
                  </form>

                  {/* Divider */}
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className={cn("w-full border-t", isDark ? "border-white/10" : "border-black/10")} />
                    </div>
                    <div className="relative flex justify-center">
                      <span className={cn(
                        "px-3 text-[11px] font-medium",
                        isDark ? "bg-[rgba(30,30,30,0.72)] text-white/40" : "bg-[rgba(255,255,255,0.72)] text-black/30"
                      )}>
                        or
                      </span>
                    </div>
                  </div>

                  {/* Demo Login Button */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDemoLogin}
                    disabled={isLoading || demoLoading}
                    className={cn(
                      "w-full h-11 rounded-xl font-medium text-sm transition-all duration-200",
                      "mojave-frost-input mojave-frost-input-light",
                      "text-gray-700 dark:text-gray-300",
                      "hover:bg-white/70 dark:hover:bg-gray-700/60",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "flex items-center justify-center gap-2"
                    )}
                  >
                    {demoLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-primary" />
                        Try Demo
                        <span className={cn(
                          "ml-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold",
                          "bg-primary/15 text-primary"
                        )}>
                          VIEW ONLY
                        </span>
                      </>
                    )}
                  </motion.button>
                </div>

                {/* Info hint */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="mt-4 text-center"
                >
                  <p className="text-[11px] text-white/50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                    <KeyRound className="inline h-3 w-3 mr-1 -mt-0.5" />
                    New device? Serial key required to activate ERP.
                  </p>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============================================
          Bottom Bar — Mojave Menu Bar
          ============================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "h-10 mojave-menubar mojave-menubar-light",
          "flex items-center justify-between px-5 shrink-0"
        )}
      >
        {/* Left — Theme Toggle */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-medium transition-colors",
              isDark ? "text-white/60 hover:text-white/90" : "text-black/50 hover:text-black/80"
            )}
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {isDark ? 'Light' : 'Dark'}
          </motion.button>
        </div>

        {/* Center — Accessibility */}
        <div className="flex items-center gap-4">
          <button className={cn(
            "text-[11px] font-medium transition-colors",
            isDark ? "text-white/40 hover:text-white/70" : "text-black/35 hover:text-black/65"
          )}>
            Accessibility
          </button>
        </div>

        {/* Right — Power Actions */}
        <div className="flex items-center gap-3">
          <button
            className={cn(
              "flex items-center gap-1 text-[11px] font-medium transition-colors",
              isDark ? "text-white/40 hover:text-white/70" : "text-black/35 hover:text-black/65"
            )}
          >
            <RotateCw className="h-3 w-3" />
            Restart
          </button>
          <button
            className={cn(
              "flex items-center gap-1 text-[11px] font-medium transition-colors",
              isDark ? "text-white/40 hover:text-white/70" : "text-black/35 hover:text-black/65"
            )}
          >
            <Power className="h-3 w-3" />
            Shut Down
          </button>
        </div>
      </motion.div>
    </div>
  )
}
