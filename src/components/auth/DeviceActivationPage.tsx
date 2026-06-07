'use client'

import React, { useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  KeyRound, Shield, Monitor, Loader2, CheckCircle2, AlertCircle,
  ArrowRight, Smartphone, Laptop, Globe, Fingerprint
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

function getDeviceInfo() {
  if (typeof window === 'undefined') return { browser: 'Unknown', os: 'Unknown', deviceName: 'Unknown Device' }
  const ua = navigator.userAgent
  let browser = 'Unknown'; let os = 'Unknown'
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Edg')) browser = 'Edge'
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  return { browser, os, deviceName: `${browser} on ${os}` }
}

export default function DeviceActivationPage() {
  const { activateDevice, user, logout } = useAppStore()
  const [serialKey, setSerialKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const deviceInfo = getDeviceInfo()
  const fingerprint = typeof window !== 'undefined' ? getDeviceFingerprint() : ''

  const handleActivate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true)
    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serialKey: serialKey.trim().toUpperCase(), deviceFingerprint: fingerprint, deviceName: deviceInfo.deviceName, browser: deviceInfo.browser, os: deviceInfo.os }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Activation failed'); return }
      setSuccess(true); activateDevice()
      toast.success('Device activated!', { description: 'This device is now registered with your license.' })
    } catch { setError('Network error. Please check your connection.') }
    finally { setIsLoading(false) }
  }, [serialKey, fingerprint, deviceInfo, activateDevice])

  const handleSkipForDemo = useCallback(() => {
    setSerialKey('FFOS-DEMO-2024-ACTIVE'); activateDevice()
    toast.success('Demo activation applied', { description: 'Full demo access granted on this device.' })
  }, [activateDevice])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Ambient Background — Solid */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-chart-3/3" />
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/3 w-80 h-80 bg-primary/8 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
          className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-chart-2/8 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl retina-shadow-lg overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-5 text-center relative">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4 tahoe-glow"
            >
              <KeyRound className="h-7 w-7" />
            </motion.div>
            <h1 className="relative text-lg font-bold">Activate This Device</h1>
            <p className="relative text-[13px] text-muted-foreground mt-1 max-w-xs mx-auto">
              New devices require a serial key to activate FleetFlow OS.
            </p>
          </div>

          {/* Device Info — Solid Card */}
          <div className="mx-6 mb-5 p-3.5 rounded-xl bg-secondary border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-background border border-border text-foreground">
                {deviceInfo.os === 'Windows' ? <Monitor className="h-4 w-4" /> :
                 deviceInfo.os === 'macOS' ? <Laptop className="h-4 w-4" /> :
                 deviceInfo.os === 'Android' || deviceInfo.os === 'iOS' ? <Smartphone className="h-4 w-4" /> :
                 <Globe className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-[13px] font-medium">{deviceInfo.deviceName}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{fingerprint}</p>
              </div>
              <span className="ml-auto px-2 py-0.5 rounded-md bg-chart-5/10 text-chart-5 text-[9px] font-bold">NEW</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Secure</span>
              <span className="flex items-center gap-1"><Fingerprint className="h-3 w-3" /> Verified</span>
            </div>
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-8 pb-8">
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-chart-4/10 text-chart-4 mb-4"
                  >
                    <CheckCircle2 className="h-7 w-7" />
                  </motion.div>
                  <h3 className="text-base font-semibold mb-1">Device Activated!</h3>
                  <p className="text-[13px] text-muted-foreground">Redirecting...</p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-8 pb-8">
                <form onSubmit={handleActivate} className="space-y-3.5">
                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[13px]">
                          <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-1.5">
                    <Label htmlFor="serialKey" className="text-[13px] font-medium">Serial Key</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="serialKey" type="text" placeholder="FFOS-XXXX-XXXX-XXXX"
                        value={serialKey}
                        onChange={(e) => { setSerialKey(e.target.value.toUpperCase()); setError('') }}
                        className="pl-10 h-10 rounded-xl bg-secondary border-border font-mono tracking-wider uppercase focus:bg-background transition-colors"
                        required disabled={isLoading} autoComplete="off"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">Enter the serial key from your FleetFlow OS license.</p>
                  </div>

                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button type="submit" className="w-full h-10 font-semibold gap-2 rounded-xl" disabled={isLoading || !serialKey.trim()}>
                      {isLoading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Activating...</>
                      ) : (
                        <><span>Activate Device</span><ArrowRight className="h-4 w-4" /></>
                      )}
                    </Button>
                  </motion.div>
                </form>

                <div className="mt-4 relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center"><span className="bg-card px-2 text-[11px] text-muted-foreground">or</span></div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSkipForDemo}
                  className="w-full mt-4 p-3 rounded-xl bg-secondary border border-border text-[13px] text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                >
                  <span className="font-medium">Skip for Demo</span>
                  <span className="text-[10px] block mt-0.5 text-muted-foreground/70">Auto-activate with demo key</span>
                </motion.button>

                <div className="mt-5 pt-4 border-t border-border text-center">
                  <button onClick={() => logout()} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                    Sign in with a different account
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-5 text-center text-[10px] text-muted-foreground">
          <p>FleetFlow OS uses device activation to protect your license.</p>
        </div>
      </motion.div>
    </div>
  )
}
