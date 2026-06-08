'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, EyeOff, ArrowRight, Loader2,
  Moon, Sun, Truck
} from 'lucide-react'
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
// FleetFlow OS Login Page
// ============================================
export default function LoginPage() {
  const { login } = useAppStore()
  const { setTheme, resolvedTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [demoLoading, setDemoLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => setShowForm(true), 300)
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e8f4f8] via-[#dceef5] to-[#c8e0ec] dark:from-[#0a0f1a] dark:via-[#0f1729] dark:to-[#0a0e18]">
        <div className="animate-pulse w-16 h-16 rounded-2xl bg-primary/20" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* ============================================
          Background — Soft Gradient (using Tailwind dark: to avoid hydration mismatch)
          ============================================ */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#e8f4f8] via-[#dceef5] to-[#c8e0ec] dark:from-[#0a0f1a] dark:via-[#0f1729] dark:to-[#0a0e18]" />
        {/* Subtle decorative circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl bg-primary/8 dark:bg-primary/5" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl bg-primary/6 dark:bg-primary/3" />
      </div>

      {/* ============================================
          Theme Toggle — Top Right
          ============================================ */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="absolute top-6 right-6 z-20 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 bg-black/5 text-gray-500 hover:text-gray-700 hover:bg-black/8 dark:bg-white/10 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-white/15"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </motion.button>

      {/* ============================================
          Login Card
          ============================================ */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[420px] mx-4 rounded-2xl p-8 bg-white border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:bg-[#16181c] dark:border-[#2a2d35] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          >
            {/* ============================================
                Logo + Title
                ============================================ */}
            <div className="flex flex-col items-center text-center">
              {/* Logo Icon */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-primary to-primary/80">
                <Truck className="h-8 w-8 text-white" />
              </div>

              <h1 className="mt-5 text-2xl font-bold text-gray-900 dark:text-gray-100">
                FleetFlow OS
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Enterprise Fleet Management Platform
              </p>
            </div>

            {/* ============================================
                Error Message
                ============================================ */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="mt-5 overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm bg-red-50 text-red-600 border border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ============================================
                Form
                ============================================ */}
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold tracking-wider mb-1.5 text-gray-500 dark:text-gray-400">
                  EMAIL
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  className="w-full h-12 px-4 rounded-lg text-sm outline-none transition-all duration-200 bg-[#fafbfc] border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary/60 focus:ring-1 focus:ring-primary/20 focus:bg-white dark:bg-[#1e2028] dark:border-[#2a2d35] dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-primary/60 dark:focus:ring-primary/20"
                  required
                  autoComplete="email"
                  disabled={isLoading || demoLoading}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-semibold tracking-wider mb-1.5 text-gray-500 dark:text-gray-400">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    className="w-full h-12 px-4 pr-11 rounded-lg text-sm outline-none transition-all duration-200 bg-[#fafbfc] border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-primary/60 focus:ring-1 focus:ring-primary/20 focus:bg-white dark:bg-[#1e2028] dark:border-[#2a2d35] dark:text-gray-100 dark:placeholder:text-gray-600 dark:focus:border-primary/60 dark:focus:ring-primary/20"
                    required
                    autoComplete="current-password"
                    disabled={isLoading || demoLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Sign In Button */}
              <motion.button
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={isLoading || demoLoading}
                className="w-full h-12 rounded-lg font-semibold text-sm transition-all duration-200 bg-primary text-white hover:bg-primary/90 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                ) : (
                  <>Sign In <ArrowRight className="h-4 w-4" /></>
                )}
              </motion.button>
            </form>

            {/* ============================================
                Divider
                ============================================ */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100 dark:border-[#2a2d35]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 text-xs font-medium bg-white text-gray-400 dark:bg-[#16181c] dark:text-gray-600">
                  OR
                </span>
              </div>
            </div>

            {/* ============================================
                View Only / Demo Button
                ============================================ */}
            <motion.button
              whileHover={{ scale: 1.005 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleDemoLogin}
              disabled={isLoading || demoLoading}
              className="w-full h-11 rounded-lg font-medium text-sm transition-all duration-200 border border-primary/40 text-primary hover:bg-primary/5 dark:border-primary/30 dark:hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {demoLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  View Only
                </>
              )}
            </motion.button>


          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
