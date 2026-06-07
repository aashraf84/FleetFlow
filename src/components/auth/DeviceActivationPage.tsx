'use client'

import React, { useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  KeyRound, Shield, Monitor, Loader2, CheckCircle2, AlertCircle,
  ArrowRight, RefreshCw, Smartphone, Laptop, Globe, Fingerprint
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
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return 'FFD-' + Math.abs(hash).toString(36).toUpperCase().slice(0, 12)
}

function getDeviceInfo() {
  if (typeof window === 'undefined') return { browser: 'Unknown', os: 'Unknown', deviceName: 'Unknown Device' }
  const ua = navigator.userAgent
  let browser = 'Unknown'
  let os = 'Unknown'
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
  const { theme } = useTheme()
  
  const [serialKey, setSerialKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const deviceInfo = getDeviceInfo()
  const fingerprint = typeof window !== 'undefined' ? getDeviceFingerprint() : ''

  const handleActivate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serialKey: serialKey.trim().toUpperCase(),
          deviceFingerprint: fingerprint,
          deviceName: deviceInfo.deviceName,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Activation failed')
        return
      }

      setSuccess(true)
      activateDevice()
      toast.success('Device activated!', {
        description: 'This device is now registered with your license.',
      })

      // Auto-redirect after brief delay
      setTimeout(() => {
        // The page.tsx will handle the redirect since deviceActivated is now true
      }, 1500)
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setIsLoading(false)
    }
  }, [serialKey, fingerprint, deviceInfo, activateDevice])

  const handleSkipForDemo = useCallback(() => {
    // For demo purposes, auto-activate with demo serial key
    setSerialKey('FFOS-DEMO-2024-ACTIVE')
    activateDevice()
    toast.success('Demo activation applied', {
      description: 'Full demo access granted on this device.',
    })
  }, [activateDevice])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-lg"
      >
        <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center bg-gradient-to-b from-primary/5 to-transparent">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4"
            >
              <KeyRound className="h-8 w-8" />
            </motion.div>
            <h1 className="text-xl font-bold">Activate This Device</h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
              New devices require a serial key to activate FleetFlow OS. Enter your license key below.
            </p>
          </div>

          {/* Device Info Card */}
          <div className="mx-8 mb-6 p-4 rounded-xl bg-muted/50 border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-background border border-border">
                {deviceInfo.os === 'Windows' ? <Monitor className="h-4 w-4" /> :
                 deviceInfo.os === 'macOS' ? <Laptop className="h-4 w-4" /> :
                 deviceInfo.os === 'Android' || deviceInfo.os === 'iOS' ? <Smartphone className="h-4 w-4" /> :
                 <Globe className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-medium">{deviceInfo.deviceName}</p>
                <p className="text-xs text-muted-foreground">ID: {fingerprint}</p>
              </div>
              <Badge variant="outline" className="ml-auto text-[10px]">NEW DEVICE</Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Secure Activation
              </span>
              <span className="flex items-center gap-1">
                <Fingerprint className="h-3 w-3" />
                Device Verified
              </span>
            </div>
          </div>

          {/* Activation Form */}
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="px-8 pb-8"
              >
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 text-green-600 mb-4"
                  >
                    <CheckCircle2 className="h-7 w-7" />
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-1">Device Activated!</h3>
                  <p className="text-sm text-muted-foreground">
                    This device is now registered. Redirecting...
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-8 pb-8"
              >
                <form onSubmit={handleActivate} className="space-y-4">
                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>{error}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <Label htmlFor="serialKey" className="text-sm font-medium">
                      Serial Key / License Key
                    </Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="serialKey"
                        type="text"
                        placeholder="FFOS-XXXX-XXXX-XXXX"
                        value={serialKey}
                        onChange={(e) => {
                          setSerialKey(e.target.value.toUpperCase())
                          setError('')
                        }}
                        className="pl-10 h-11 font-mono tracking-wider uppercase"
                        required
                        disabled={isLoading}
                        autoComplete="off"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter the serial key provided with your FleetFlow OS license.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 font-semibold gap-2"
                    disabled={isLoading || !serialKey.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Activating Device...
                      </>
                    ) : (
                      <>
                        Activate Device
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Demo skip */}
                <div className="mt-4 relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <button
                  onClick={handleSkipForDemo}
                  className="w-full mt-4 p-3 rounded-lg border border-dashed border-primary/30 text-sm text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                >
                  <span className="font-medium">Skip for Demo</span>
                  <span className="text-xs block mt-0.5">Auto-activate with demo key (FFOS-DEMO-2024-ACTIVE)</span>
                </button>

                {/* Sign out */}
                <div className="mt-6 pt-4 border-t border-border/50 text-center">
                  <button
                    onClick={() => logout()}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Sign in with a different account
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>FleetFlow OS uses device activation to protect your license.</p>
          <p className="mt-1">Each license supports a limited number of devices.</p>
        </div>
      </motion.div>
    </div>
  )
}
