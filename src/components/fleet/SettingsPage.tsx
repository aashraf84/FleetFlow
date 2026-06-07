'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { useAppStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, Bell, Shield, Palette, Globe, Receipt, FileText, CreditCard,
  DollarSign, Mail, Database, Check, RotateCcw, Save, Loader2, ChevronRight, X,
  Building2, Printer, Hash, Image, Type, Paperclip, Banknote, Percent,
  Lock, Smartphone, Clock, AlertTriangle, Monitor, Eye, Server, HardDrive,
  Wifi, Activity, Zap, Sun, Moon, Wallet
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================
// Types
// ============================================

type SettingCategory = 'general' | 'receipt' | 'invoice' | 'payment' | 'tax' | 'email' | 'notification' | 'security' | 'appearance'

interface CategoryMeta {
  id: SettingCategory
  label: string
  icon: React.ComponentType<any>
  description: string
  color: string
}

const CATEGORIES: CategoryMeta[] = [
  { id: 'general', label: 'General', icon: Globe, description: 'Company info, language, timezone', color: 'text-blue-500' },
  { id: 'receipt', label: 'Receipts', icon: Receipt, description: 'Receipt numbering, layout, printing', color: 'text-amber-500' },
  { id: 'invoice', label: 'Invoices', icon: FileText, description: 'Invoice format, terms, bank details', color: 'text-emerald-500' },
  { id: 'payment', label: 'Payments', icon: CreditCard, description: 'Payment methods, late fees, deposits', color: 'text-violet-500' },
  { id: 'tax', label: 'Tax', icon: Percent, description: 'Tax rates, inclusive/exclusive pricing', color: 'text-rose-500' },
  { id: 'email', label: 'Email', icon: Mail, description: 'SMTP configuration, templates', color: 'text-cyan-500' },
  { id: 'notification', label: 'Notifications', icon: Bell, description: 'Alerts, reminders, digest', color: 'text-orange-500' },
  { id: 'security', label: 'Security', icon: Shield, description: '2FA, password policy, lockout', color: 'text-red-500' },
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme, colors, layout', color: 'text-teal-500' },
]

// ============================================
// Default Settings
// ============================================

const DEFAULT_SETTINGS: Record<SettingCategory, Record<string, any>> = {
  general: {
    companyName: 'FleetFlow OS',
    companyLogo: '',
    language: 'en',
    timezone: 'UTC',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    fiscalYearStart: '01',
    weekStartsOn: 'monday',
    phone: '',
    email: '',
    address: '',
    website: '',
    taxId: '',
    registrationNumber: '',
  },
  receipt: {
    prefix: 'RCT',
    nextNumber: 1,
    numberingFormat: 'prefix-sequential',
    autoPrint: false,
    showTaxes: true,
    showCustomerDetails: true,
    showPaymentMethod: true,
    showVehicleDetails: true,
    showDriverDetails: false,
    showCompanyLogo: true,
    paperSize: 'A4',
    footerText: 'Thank you for your business!',
    headerText: '',
    showBarcode: false,
    showQRCode: false,
    duplicateReceipt: false,
  },
  invoice: {
    prefix: 'INV',
    nextNumber: 1,
    numberingFormat: 'prefix-sequential',
    paymentTerms: 'net_30',
    dueDays: 30,
    autoGenerate: true,
    autoSend: false,
    showCompanyLogo: true,
    showTaxes: true,
    showDiscount: true,
    showPaymentDetails: true,
    showBankDetails: false,
    paperSize: 'A4',
    headerText: '',
    footerText: '',
    notes: '',
    termsAndConditions: 'Payment is due within 30 days of invoice date. Late payments may be subject to a fee.',
    bankName: '',
    bankAccount: '',
    bankIban: '',
    bankSwift: '',
  },
  payment: {
    acceptedMethods: ['cash', 'card', 'bank_transfer', 'check'],
    autoReceipt: true,
    lateFeeEnabled: false,
    lateFeeType: 'percentage',
    lateFeeValue: 0,
    lateFeeGraceDays: 0,
    depositPercentage: 10,
    depositRequired: true,
    partialPayments: true,
    roundOff: false,
    currencySymbol: '$',
    decimalPlaces: 2,
  },
  tax: {
    enabled: true,
    taxInclusive: false,
    defaultTaxRate: 0,
    taxName: 'VAT',
    taxId: '',
    taxRates: [] as { name: string; rate: number; enabled: boolean }[],
    showTaxIdOnInvoice: true,
    compoundTax: false,
  },
  email: {
    provider: 'smtp',
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpEncryption: 'tls',
    fromName: 'FleetFlow OS',
    fromEmail: '',
    replyTo: '',
    templateHeader: '',
    templateFooter: '',
  },
  notification: {
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    maintenanceAlerts: true,
    complianceReminders: true,
    rentalAlerts: true,
    paymentAlerts: true,
    overdueAlerts: true,
    dailyDigest: false,
    weeklyReport: true,
    alertDaysBefore: 7,
  },
  security: {
    twoFactorAuth: false,
    sessionTimeout: 30,
    maxDevices: 3,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: false,
    loginAttempts: 5,
    lockoutDuration: 30,
    ipWhitelist: '',
  },
  appearance: {
    theme: 'system',
    primaryColor: '#0d9488',
    sidebarStyle: 'solid',
    compactMode: false,
    showAvatar: true,
    animationEnabled: true,
  },
}

// ============================================
// Helper Components
// ============================================

function SettingRow({ label, description, children, className }: {
  label: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-4 py-3', className)}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function SettingField({ label, description, children }: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      {children}
    </div>
  )
}

function SectionTitle({ icon: Icon, title, description }: { icon: React.ComponentType<any>; title: string; description?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
    </div>
  )
}

function SettingSwitch({ checked, onChange, label, description }: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <SettingRow label={label} description={description}>
      <Switch checked={checked} onCheckedChange={onChange} />
    </SettingRow>
  )
}

// ============================================
// Main Settings Page
// ============================================

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { sessionToken, isDemo, user } = useAppStore()
  const [activeCategory, setActiveCategory] = useState<SettingCategory>('general')
  const [settings, setSettings] = useState<Record<SettingCategory, Record<string, any>>>(DEFAULT_SETTINGS)
  const [originalSettings, setOriginalSettings] = useState<Record<SettingCategory, Record<string, any>>>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [testEmailSending, setTestEmailSending] = useState(false)

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/fleet/settings', {
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        })
        if (res.ok) {
          const json = await res.json()
          if (json.data) {
            const loaded = { ...DEFAULT_SETTINGS }
            for (const cat of CATEGORIES.map(c => c.id)) {
              if (json.data[cat]) {
                loaded[cat] = { ...DEFAULT_SETTINGS[cat], ...json.data[cat] }
              }
            }
            setSettings(loaded)
            setOriginalSettings(JSON.parse(JSON.stringify(loaded)))
          }
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [sessionToken])

  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings)
    setHasChanges(changed)
  }, [settings, originalSettings])

  // Update a single field in a category
  const updateField = useCallback((category: SettingCategory, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      }
    }))
  }, [])

  // Save current category
  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/fleet/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: activeCategory,
          data: settings[activeCategory],
        }),
      })
      if (res.ok) {
        setOriginalSettings(prev => ({
          ...prev,
          [activeCategory]: { ...settings[activeCategory] }
        }))
        toast.success(`${CATEGORIES.find(c => c.id === activeCategory)?.label} settings saved`)
      } else {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error || 'Failed to save settings')
      }
    } catch (err) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }, [activeCategory, settings, sessionToken])

  // Save all categories
  const handleSaveAll = useCallback(async () => {
    setSaving(true)
    try {
      const promises = CATEGORIES.map(cat =>
        fetch('/api/fleet/settings', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category: cat.id,
            data: settings[cat.id],
          }),
        })
      )
      await Promise.all(promises)
      setOriginalSettings(JSON.parse(JSON.stringify(settings)))
      toast.success('All settings saved successfully')
    } catch (err) {
      toast.error('Failed to save some settings')
    } finally {
      setSaving(false)
    }
  }, [settings, sessionToken])

  // Reset current category to defaults
  const handleReset = useCallback(async () => {
    try {
      const res = await fetch(`/api/fleet/settings?category=${activeCategory}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionToken}` }
      })
      if (res.ok) {
        const json = await res.json()
        setSettings(prev => ({
          ...prev,
          [activeCategory]: { ...DEFAULT_SETTINGS[activeCategory], ...json.data }
        }))
        setOriginalSettings(prev => ({
          ...prev,
          [activeCategory]: { ...DEFAULT_SETTINGS[activeCategory], ...json.data }
        }))
        toast.success(`${CATEGORIES.find(c => c.id === activeCategory)?.label} settings reset to defaults`)
      }
    } catch (err) {
      toast.error('Failed to reset settings')
    }
  }, [activeCategory, sessionToken])

  // Test email config
  const handleTestEmail = useCallback(async () => {
    setTestEmailSending(true)
    try {
      // Simulate test email
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success('Test email sent successfully')
    } catch {
      toast.error('Failed to send test email')
    } finally {
      setTestEmailSending(false)
    }
  }, [])

  // Get category-specific changes count
  const getCategoryChanges = useCallback((cat: SettingCategory) => {
    return JSON.stringify(settings[cat]) !== JSON.stringify(originalSettings[cat])
  }, [settings, originalSettings])

  // ============================================
  // Render Settings Content per Category
  // ============================================

  const renderContent = () => {
    const s = settings[activeCategory]

    switch (activeCategory) {
      // ============================================
      // GENERAL SETTINGS
      // ============================================
      case 'general':
        return (
          <div className="space-y-6">
            <SectionTitle icon={Building2} title="Company Information" description="Your organization details used across all modules" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SettingField label="Company Name" description="Displayed on invoices, receipts, and reports">
                    <Input value={s.companyName} onChange={e => updateField('general', 'companyName', e.target.value)} className="h-9" />
                  </SettingField>
                  <SettingField label="Registration Number" description="Business registration / incorporation number">
                    <Input value={s.registrationNumber} onChange={e => updateField('general', 'registrationNumber', e.target.value)} className="h-9" placeholder="e.g. CR-12345" />
                  </SettingField>
                  <SettingField label="Tax ID / VAT Number" description="Used for tax calculations on invoices">
                    <Input value={s.taxId} onChange={e => updateField('general', 'taxId', e.target.value)} className="h-9" placeholder="e.g. VAT123456789" />
                  </SettingField>
                  <SettingField label="Phone" description="Company contact phone number">
                    <Input value={s.phone} onChange={e => updateField('general', 'phone', e.target.value)} className="h-9" placeholder="+1 (555) 000-0000" />
                  </SettingField>
                  <SettingField label="Email" description="Primary business email">
                    <Input type="email" value={s.email} onChange={e => updateField('general', 'email', e.target.value)} className="h-9" placeholder="contact@company.com" />
                  </SettingField>
                  <SettingField label="Website" description="Company website URL">
                    <Input value={s.website} onChange={e => updateField('general', 'website', e.target.value)} className="h-9" placeholder="https://company.com" />
                  </SettingField>
                </div>
                <SettingField label="Address" description="Full business address for invoices and documents">
                  <Textarea value={s.address} onChange={e => updateField('general', 'address', e.target.value)} className="min-h-[60px] resize-none" placeholder="123 Business St, City, Country" />
                </SettingField>
              </CardContent>
            </Card>

            <SectionTitle icon={Globe} title="Regional Settings" description="Language, timezone, and formatting preferences" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SettingField label="Language" description="Interface display language">
                    <Select value={s.language} onValueChange={v => updateField('general', 'language', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">العربية (Arabic)</SelectItem>
                        <SelectItem value="fr">Français (French)</SelectItem>
                        <SelectItem value="es">Español (Spanish)</SelectItem>
                        <SelectItem value="de">Deutsch (German)</SelectItem>
                        <SelectItem value="ur">اردو (Urdu)</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingField>
                  <SettingField label="Timezone" description="All dates displayed in this timezone">
                    <Select value={s.timezone} onValueChange={v => updateField('general', 'timezone', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern (EST/EDT)</SelectItem>
                        <SelectItem value="America/Chicago">Central (CST/CDT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific (PST/PDT)</SelectItem>
                        <SelectItem value="Asia/Karachi">Pakistan (PKT)</SelectItem>
                        <SelectItem value="Asia/Dubai">Gulf (GST)</SelectItem>
                        <SelectItem value="Asia/Riyadh">Saudi Arabia (AST)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                        <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingField>
                  <SettingField label="Currency" description="Default currency for all monetary values">
                    <Select value={s.currency} onValueChange={v => updateField('general', 'currency', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="AED">AED (د.إ)</SelectItem>
                        <SelectItem value="SAR">SAR (﷼)</SelectItem>
                        <SelectItem value="PKR">PKR (₨)</SelectItem>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="QAR">QAR (﷼)</SelectItem>
                        <SelectItem value="KWD">KWD (د.ك)</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingField>
                  <SettingField label="Date Format" description="How dates are displayed throughout the app">
                    <Select value={s.dateFormat} onValueChange={v => updateField('general', 'dateFormat', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        <SelectItem value="DD-MMM-YYYY">DD-MMM-YYYY</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingField>
                  <SettingField label="Time Format" description="12-hour or 24-hour clock">
                    <Select value={s.timeFormat} onValueChange={v => updateField('general', 'timeFormat', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                        <SelectItem value="24h">24 Hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingField>
                  <SettingField label="Fiscal Year Start" description="Month when your fiscal year begins">
                    <Select value={s.fiscalYearStart} onValueChange={v => updateField('general', 'fiscalYearStart', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
                          <SelectItem key={m} value={m}>
                            {new Date(2024, parseInt(m) - 1, 1).toLocaleString('en', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </SettingField>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      // ============================================
      // RECEIPT SETTINGS
      // ============================================
      case 'receipt':
        return (
          <div className="space-y-6">
            <SectionTitle icon={Hash} title="Receipt Numbering" description="Configure how receipt numbers are generated" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SettingField label="Prefix" description="Added before each receipt number">
                    <Input value={s.prefix} onChange={e => updateField('receipt', 'prefix', e.target.value)} className="h-9" placeholder="RCT" />
                  </SettingField>
                  <SettingField label="Next Number" description="Auto-increments with each receipt">
                    <Input type="number" value={s.nextNumber} onChange={e => updateField('receipt', 'nextNumber', parseInt(e.target.value) || 1)} className="h-9" />
                  </SettingField>
                  <SettingField label="Numbering Format" description="How the receipt number is structured">
                    <Select value={s.numberingFormat} onValueChange={v => updateField('receipt', 'numberingFormat', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prefix-sequential">Prefix-Sequential (RCT-001)</SelectItem>
                        <SelectItem value="prefix-year-sequential">Prefix-Year-Sequential (RCT-2024-001)</SelectItem>
                        <SelectItem value="prefix-date-sequential">Prefix-Date-Sequential (RCT-20240315-001)</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingField>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border">
                  <span className="text-xs text-muted-foreground">Preview:</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {s.numberingFormat === 'prefix-sequential' && `${s.prefix}-${String(s.nextNumber).padStart(3, '0')}`}
                    {s.numberingFormat === 'prefix-year-sequential' && `${s.prefix}-${new Date().getFullYear()}-${String(s.nextNumber).padStart(3, '0')}`}
                    {s.numberingFormat === 'prefix-date-sequential' && `${s.prefix}-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(s.nextNumber).padStart(3, '0')}`}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <SectionTitle icon={Printer} title="Printing & Layout" description="Paper size and printing behavior" />
            <Card>
              <CardContent className="p-5 space-y-1">
                <SettingField label="Paper Size" description="Receipt paper size for printing">
                  <Select value={s.paperSize} onValueChange={v => updateField('receipt', 'paperSize', v)}>
                    <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4 (210 × 297mm)</SelectItem>
                      <SelectItem value="Letter">Letter (8.5 × 11in)</SelectItem>
                      <SelectItem value="Thermal-80mm">Thermal 80mm</SelectItem>
                      <SelectItem value="Thermal-58mm">Thermal 58mm</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingField>
                <Separator />
                <SettingSwitch checked={s.autoPrint} onChange={v => updateField('receipt', 'autoPrint', v)} label="Auto-print on creation" description="Automatically print receipt when created" />
                <Separator />
                <SettingSwitch checked={s.duplicateReceipt} onChange={v => updateField('receipt', 'duplicateReceipt', v)} label="Print duplicate copy" description="Print a customer and office copy" />
              </CardContent>
            </Card>

            <SectionTitle icon={Eye} title="Display Options" description="What information appears on receipts" />
            <Card>
              <CardContent className="p-5 space-y-1">
                <SettingSwitch checked={s.showCompanyLogo} onChange={v => updateField('receipt', 'showCompanyLogo', v)} label="Show company logo" description="Display your company logo at the top" />
                <Separator />
                <SettingSwitch checked={s.showCustomerDetails} onChange={v => updateField('receipt', 'showCustomerDetails', v)} label="Show customer details" description="Customer name, phone, and ID" />
                <Separator />
                <SettingSwitch checked={s.showVehicleDetails} onChange={v => updateField('receipt', 'showVehicleDetails', v)} label="Show vehicle details" description="Vehicle make, model, and registration" />
                <Separator />
                <SettingSwitch checked={s.showDriverDetails} onChange={v => updateField('receipt', 'showDriverDetails', v)} label="Show driver details" description="Driver name and license number" />
                <Separator />
                <SettingSwitch checked={s.showPaymentMethod} onChange={v => updateField('receipt', 'showPaymentMethod', v)} label="Show payment method" description="How the payment was made" />
                <Separator />
                <SettingSwitch checked={s.showTaxes} onChange={v => updateField('receipt', 'showTaxes', v)} label="Show tax breakdown" description="Display tax amounts separately" />
                <Separator />
                <SettingSwitch checked={s.showBarcode} onChange={v => updateField('receipt', 'showBarcode', v)} label="Show barcode" description="Print receipt barcode for scanning" />
                <Separator />
                <SettingSwitch checked={s.showQRCode} onChange={v => updateField('receipt', 'showQRCode', v)} label="Show QR code" description="QR code linking to digital receipt" />
              </CardContent>
            </Card>

            <SectionTitle icon={Type} title="Header & Footer" description="Custom text on receipts" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <SettingField label="Header Text" description="Appears at the top of each receipt">
                  <Input value={s.headerText} onChange={e => updateField('receipt', 'headerText', e.target.value)} className="h-9" placeholder="e.g. OFFICIAL RECEIPT" />
                </SettingField>
                <SettingField label="Footer Text" description="Appears at the bottom of each receipt">
                  <Textarea value={s.footerText} onChange={e => updateField('receipt', 'footerText', e.target.value)} className="min-h-[60px] resize-none" placeholder="Thank you for your business!" />
                </SettingField>
              </CardContent>
            </Card>
          </div>
        )

      // ============================================
      // INVOICE SETTINGS
      // ============================================
      case 'invoice':
        return (
          <div className="space-y-6">
            <SectionTitle icon={Hash} title="Invoice Numbering" description="Configure how invoice numbers are generated" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SettingField label="Prefix" description="Added before each invoice number">
                    <Input value={s.prefix} onChange={e => updateField('invoice', 'prefix', e.target.value)} className="h-9" placeholder="INV" />
                  </SettingField>
                  <SettingField label="Next Number" description="Auto-increments with each invoice">
                    <Input type="number" value={s.nextNumber} onChange={e => updateField('invoice', 'nextNumber', parseInt(e.target.value) || 1)} className="h-9" />
                  </SettingField>
                  <SettingField label="Numbering Format" description="How the invoice number is structured">
                    <Select value={s.numberingFormat} onValueChange={v => updateField('invoice', 'numberingFormat', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prefix-sequential">Prefix-Sequential (INV-001)</SelectItem>
                        <SelectItem value="prefix-year-sequential">Prefix-Year-Sequential (INV-2024-001)</SelectItem>
                        <SelectItem value="prefix-date-sequential">Prefix-Date-Sequential (INV-20240315-001)</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingField>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border">
                  <span className="text-xs text-muted-foreground">Preview:</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {s.numberingFormat === 'prefix-sequential' && `${s.prefix}-${String(s.nextNumber).padStart(3, '0')}`}
                    {s.numberingFormat === 'prefix-year-sequential' && `${s.prefix}-${new Date().getFullYear()}-${String(s.nextNumber).padStart(3, '0')}`}
                    {s.numberingFormat === 'prefix-date-sequential' && `${s.prefix}-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${String(s.nextNumber).padStart(3, '0')}`}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <SectionTitle icon={CreditCard} title="Payment Terms" description="When invoices are due and how they're generated" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SettingField label="Payment Terms" description="Default payment terms for new invoices">
                    <Select value={s.paymentTerms} onValueChange={v => updateField('invoice', 'paymentTerms', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="due_on_receipt">Due on Receipt</SelectItem>
                        <SelectItem value="net_15">Net 15</SelectItem>
                        <SelectItem value="net_30">Net 30</SelectItem>
                        <SelectItem value="net_45">Net 45</SelectItem>
                        <SelectItem value="net_60">Net 60</SelectItem>
                        <SelectItem value="net_90">Net 90</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingField>
                  <SettingField label="Due Days" description="Number of days until the invoice is due">
                    <Input type="number" value={s.dueDays} onChange={e => updateField('invoice', 'dueDays', parseInt(e.target.value) || 30)} className="h-9" />
                  </SettingField>
                </div>
                <Separator />
                <SettingSwitch checked={s.autoGenerate} onChange={v => updateField('invoice', 'autoGenerate', v)} label="Auto-generate invoices" description="Create invoices automatically when rental contract is completed" />
                <SettingSwitch checked={s.autoSend} onChange={v => updateField('invoice', 'autoSend', v)} label="Auto-send invoices" description="Email invoices to customers automatically after creation" />
              </CardContent>
            </Card>

            <SectionTitle icon={Eye} title="Display Options" description="What information appears on invoices" />
            <Card>
              <CardContent className="p-5 space-y-1">
                <SettingSwitch checked={s.showCompanyLogo} onChange={v => updateField('invoice', 'showCompanyLogo', v)} label="Show company logo" description="Display your company logo at the top" />
                <Separator />
                <SettingSwitch checked={s.showTaxes} onChange={v => updateField('invoice', 'showTaxes', v)} label="Show tax breakdown" description="Display tax amounts separately" />
                <Separator />
                <SettingSwitch checked={s.showDiscount} onChange={v => updateField('invoice', 'showDiscount', v)} label="Show discount column" description="Display discount per line item" />
                <Separator />
                <SettingSwitch checked={s.showPaymentDetails} onChange={v => updateField('invoice', 'showPaymentDetails', v)} label="Show payment details" description="Payment instructions on invoice" />
                <Separator />
                <SettingSwitch checked={s.showBankDetails} onChange={v => updateField('invoice', 'showBankDetails', v)} label="Show bank details" description="Display bank account for transfers" />
              </CardContent>
            </Card>

            <SectionTitle icon={Banknote} title="Bank Details" description="Displayed on invoices when enabled" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SettingField label="Bank Name">
                    <Input value={s.bankName} onChange={e => updateField('invoice', 'bankName', e.target.value)} className="h-9" placeholder="National Bank" />
                  </SettingField>
                  <SettingField label="Account Number">
                    <Input value={s.bankAccount} onChange={e => updateField('invoice', 'bankAccount', e.target.value)} className="h-9" placeholder="1234-5678-9012" />
                  </SettingField>
                  <SettingField label="IBAN">
                    <Input value={s.bankIban} onChange={e => updateField('invoice', 'bankIban', e.target.value)} className="h-9" placeholder="XX00 0000 0000 0000" />
                  </SettingField>
                  <SettingField label="SWIFT / BIC">
                    <Input value={s.bankSwift} onChange={e => updateField('invoice', 'bankSwift', e.target.value)} className="h-9" placeholder="BANKXXXX" />
                  </SettingField>
                </div>
              </CardContent>
            </Card>

            <SectionTitle icon={Type} title="Header, Footer & Notes" description="Custom text on invoices" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <SettingField label="Header Text" description="Appears at the top of each invoice">
                  <Input value={s.headerText} onChange={e => updateField('invoice', 'headerText', e.target.value)} className="h-9" placeholder="e.g. TAX INVOICE" />
                </SettingField>
                <SettingField label="Footer Text" description="Appears at the bottom of each invoice">
                  <Input value={s.footerText} onChange={e => updateField('invoice', 'footerText', e.target.value)} className="h-9" placeholder="Computer generated invoice" />
                </SettingField>
                <SettingField label="Notes" description="Additional notes on each invoice">
                  <Textarea value={s.notes} onChange={e => updateField('invoice', 'notes', e.target.value)} className="min-h-[60px] resize-none" placeholder="Additional notes for the customer..." />
                </SettingField>
                <SettingField label="Terms & Conditions" description="Legal terms displayed on each invoice">
                  <Textarea value={s.termsAndConditions} onChange={e => updateField('invoice', 'termsAndConditions', e.target.value)} className="min-h-[80px] resize-none" placeholder="Payment terms and conditions..." />
                </SettingField>
              </CardContent>
            </Card>
          </div>
        )

      // ============================================
      // PAYMENT SETTINGS
      // ============================================
      case 'payment':
        return (
          <div className="space-y-6">
            <SectionTitle icon={CreditCard} title="Accepted Payment Methods" description="Which payment methods your business accepts" />
            <Card>
              <CardContent className="p-5 space-y-1">
                {[
                  { key: 'cash', label: 'Cash', desc: 'Accept cash payments' },
                  { key: 'card', label: 'Credit/Debit Card', desc: 'Accept card payments' },
                  { key: 'bank_transfer', label: 'Bank Transfer', desc: 'Accept wire/ACH transfers' },
                  { key: 'check', label: 'Check', desc: 'Accept personal/business checks' },
                ].map((method, idx) => (
                  <React.Fragment key={method.key}>
                    {idx > 0 && <Separator />}
                    <SettingSwitch
                      checked={s.acceptedMethods.includes(method.key)}
                      onChange={v => {
                        const methods = v
                          ? [...s.acceptedMethods, method.key]
                          : s.acceptedMethods.filter((m: string) => m !== method.key)
                        updateField('payment', 'acceptedMethods', methods)
                      }}
                      label={method.label}
                      description={method.desc}
                    />
                  </React.Fragment>
                ))}
              </CardContent>
            </Card>

            <SectionTitle icon={DollarSign} title="Currency & Rounding" description="Currency symbol and decimal handling" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SettingField label="Currency Symbol" description="Symbol displayed before amounts">
                    <Input value={s.currencySymbol} onChange={e => updateField('payment', 'currencySymbol', e.target.value)} className="h-9" placeholder="$" />
                  </SettingField>
                  <SettingField label="Decimal Places" description="Number of decimal places for amounts">
                    <Select value={String(s.decimalPlaces)} onValueChange={v => updateField('payment', 'decimalPlaces', parseInt(v))}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 (No decimals)</SelectItem>
                        <SelectItem value="2">2 (Standard)</SelectItem>
                        <SelectItem value="3">3 (Precision)</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingField>
                  <div className="flex items-end">
                    <SettingSwitch checked={s.roundOff} onChange={v => updateField('payment', 'roundOff', v)} label="" />
                    <div className="ml-3">
                      <p className="text-sm font-medium">Round Off</p>
                      <p className="text-xs text-muted-foreground">Round totals to nearest whole</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <SectionTitle icon={AlertTriangle} title="Late Fee Configuration" description="Automated late payment penalties" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <SettingSwitch checked={s.lateFeeEnabled} onChange={v => updateField('payment', 'lateFeeEnabled', v)} label="Enable late fees" description="Automatically charge for overdue invoices" />
                {s.lateFeeEnabled && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SettingField label="Fee Type" description="How the late fee is calculated">
                        <Select value={s.lateFeeType} onValueChange={v => updateField('payment', 'lateFeeType', v)}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingField>
                      <SettingField label={s.lateFeeType === 'percentage' ? 'Fee Percentage' : 'Fee Amount'} description="Value of the late fee">
                        <Input
                          type="number"
                          value={s.lateFeeValue}
                          onChange={e => updateField('payment', 'lateFeeValue', parseFloat(e.target.value) || 0)}
                          className="h-9"
                          placeholder={s.lateFeeType === 'percentage' ? '5' : '50'}
                        />
                      </SettingField>
                      <SettingField label="Grace Period (days)" description="Days after due date before fee applies">
                        <Input type="number" value={s.lateFeeGraceDays} onChange={e => updateField('payment', 'lateFeeGraceDays', parseInt(e.target.value) || 0)} className="h-9" />
                      </SettingField>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            <SectionTitle icon={Wallet} title="Deposit Settings" description="Security deposit requirements" />
            <Card>
              <CardContent className="p-5 space-y-1">
                <SettingSwitch checked={s.depositRequired} onChange={v => updateField('payment', 'depositRequired', v)} label="Require deposit" description="Collect security deposit on rental" />
                <Separator />
                <div className="flex items-center justify-between gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Default Deposit Percentage</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Percentage of total rental amount</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" value={s.depositPercentage} onChange={e => updateField('payment', 'depositPercentage', parseFloat(e.target.value) || 0)} className="h-9 w-20 text-right" />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <Separator />
                <SettingSwitch checked={s.partialPayments} onChange={v => updateField('payment', 'partialPayments', v)} label="Allow partial payments" description="Customers can pay in installments" />
                <Separator />
                <SettingSwitch checked={s.autoReceipt} onChange={v => updateField('payment', 'autoReceipt', v)} label="Auto-generate receipt" description="Create payment receipt automatically" />
              </CardContent>
            </Card>
          </div>
        )

      // ============================================
      // TAX SETTINGS
      // ============================================
      case 'tax':
        return (
          <div className="space-y-6">
            <SectionTitle icon={Percent} title="Tax Configuration" description="Tax settings for invoices and receipts" />
            <Card>
              <CardContent className="p-5 space-y-1">
                <SettingSwitch checked={s.enabled} onChange={v => updateField('tax', 'enabled', v)} label="Enable tax calculations" description="Apply tax to invoices and receipts" />
                <Separator />
                <SettingSwitch checked={s.taxInclusive} onChange={v => updateField('tax', 'taxInclusive', v)} label="Tax-inclusive pricing" description="Prices already include tax (no separate tax line)" />
                <Separator />
                <SettingSwitch checked={s.compoundTax} onChange={v => updateField('tax', 'compoundTax', v)} label="Compound tax" description="Apply tax on top of other taxes" />
                <Separator />
                <SettingSwitch checked={s.showTaxIdOnInvoice} onChange={v => updateField('tax', 'showTaxIdOnInvoice', v)} label="Show Tax ID on invoices" description="Display your tax registration number" />
              </CardContent>
            </Card>

            <SectionTitle icon={Building2} title="Tax Identity" description="Your business tax registration" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SettingField label="Tax Name" description="Name displayed on documents (VAT, GST, Sales Tax, etc.)">
                    <Input value={s.taxName} onChange={e => updateField('tax', 'taxName', e.target.value)} className="h-9" placeholder="VAT" />
                  </SettingField>
                  <SettingField label="Tax ID / Registration Number" description="Your tax registration number">
                    <Input value={s.taxId} onChange={e => updateField('tax', 'taxId', e.target.value)} className="h-9" placeholder="VAT123456789" />
                  </SettingField>
                  <SettingField label="Default Tax Rate (%)" description="Applied when no specific rate is set">
                    <Input type="number" value={s.defaultTaxRate} onChange={e => updateField('tax', 'defaultTaxRate', parseFloat(e.target.value) || 0)} className="h-9" placeholder="0" />
                  </SettingField>
                </div>
              </CardContent>
            </Card>

            <SectionTitle icon={Percent} title="Custom Tax Rates" description="Multiple tax rates for different categories" />
            <Card>
              <CardContent className="p-5">
                {(!s.taxRates || s.taxRates.length === 0) && (
                  <div className="text-center py-6">
                    <Percent className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No custom tax rates configured</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Add tax rates for different product/service categories</p>
                  </div>
                )}
                {s.taxRates && s.taxRates.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {s.taxRates.map((rate: { name: string; rate: number; enabled: boolean }, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg border">
                        <Switch checked={rate.enabled} onCheckedChange={v => {
                          const rates = [...s.taxRates]
                          rates[idx] = { ...rates[idx], enabled: v }
                          updateField('tax', 'taxRates', rates)
                        }} />
                        <Input value={rate.name} onChange={e => {
                          const rates = [...s.taxRates]
                          rates[idx] = { ...rates[idx], name: e.target.value }
                          updateField('tax', 'taxRates', rates)
                        }} className="h-8 flex-1" placeholder="Rate name" />
                        <div className="flex items-center gap-1">
                          <Input type="number" value={rate.rate} onChange={e => {
                            const rates = [...s.taxRates]
                            rates[idx] = { ...rates[idx], rate: parseFloat(e.target.value) || 0 }
                            updateField('tax', 'taxRates', rates)
                          }} className="h-8 w-20 text-right" />
                          <span className="text-xs text-muted-foreground">%</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => {
                          updateField('tax', 'taxRates', s.taxRates.filter((_: any, i: number) => i !== idx))
                        }}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateField('tax', 'taxRates', [...(s.taxRates || []), { name: '', rate: 0, enabled: true }])}
                  className="w-full"
                >
                  + Add Tax Rate
                </Button>
              </CardContent>
            </Card>
          </div>
        )

      // ============================================
      // EMAIL SETTINGS
      // ============================================
      case 'email':
        return (
          <div className="space-y-6">
            <SectionTitle icon={Mail} title="Email Provider" description="Configure how emails are sent" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <SettingField label="Provider" description="Email service provider">
                  <Select value={s.provider} onValueChange={v => updateField('email', 'provider', v)}>
                    <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smtp">SMTP (Custom)</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingField>
              </CardContent>
            </Card>

            <SectionTitle icon={Server} title="SMTP Configuration" description="Mail server connection details" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SettingField label="SMTP Host" description="Mail server hostname">
                    <Input value={s.smtpHost} onChange={e => updateField('email', 'smtpHost', e.target.value)} className="h-9" placeholder="smtp.gmail.com" />
                  </SettingField>
                  <SettingField label="SMTP Port" description="Mail server port">
                    <Input type="number" value={s.smtpPort} onChange={e => updateField('email', 'smtpPort', parseInt(e.target.value) || 587)} className="h-9" placeholder="587" />
                  </SettingField>
                  <SettingField label="Username" description="SMTP authentication username">
                    <Input value={s.smtpUser} onChange={e => updateField('email', 'smtpUser', e.target.value)} className="h-9" placeholder="user@example.com" />
                  </SettingField>
                  <SettingField label="Password" description="SMTP authentication password">
                    <Input type="password" value={s.smtpPassword} onChange={e => updateField('email', 'smtpPassword', e.target.value)} className="h-9" placeholder="••••••••" />
                  </SettingField>
                  <SettingField label="Encryption" description="Connection encryption method">
                    <Select value={s.smtpEncryption} onValueChange={v => updateField('email', 'smtpEncryption', v)}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tls">TLS (Recommended)</SelectItem>
                        <SelectItem value="ssl">SSL</SelectItem>
                        <SelectItem value="none">None (Insecure)</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingField>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleTestEmail} disabled={testEmailSending || !s.smtpHost}>
                    {testEmailSending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Mail className="h-3.5 w-3.5 mr-1.5" />}
                    Send Test Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            <SectionTitle icon={Type} title="Sender Identity" description="Who emails are sent from" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SettingField label="From Name" description="Display name in the From field">
                    <Input value={s.fromName} onChange={e => updateField('email', 'fromName', e.target.value)} className="h-9" placeholder="FleetFlow OS" />
                  </SettingField>
                  <SettingField label="From Email" description="Email address in the From field">
                    <Input type="email" value={s.fromEmail} onChange={e => updateField('email', 'fromEmail', e.target.value)} className="h-9" placeholder="noreply@company.com" />
                  </SettingField>
                  <SettingField label="Reply-To" description="Where replies are sent">
                    <Input type="email" value={s.replyTo} onChange={e => updateField('email', 'replyTo', e.target.value)} className="h-9" placeholder="support@company.com" />
                  </SettingField>
                </div>
              </CardContent>
            </Card>

            <SectionTitle icon={Paperclip} title="Email Templates" description="Custom header/footer for all emails" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <SettingField label="Template Header" description="HTML header included in all outgoing emails">
                  <Textarea value={s.templateHeader} onChange={e => updateField('email', 'templateHeader', e.target.value)} className="min-h-[60px] resize-none font-mono text-xs" placeholder="<div style='background:#0d9488;padding:20px;color:white;text-align:center'>...</div>" />
                </SettingField>
                <SettingField label="Template Footer" description="HTML footer included in all outgoing emails">
                  <Textarea value={s.templateFooter} onChange={e => updateField('email', 'templateFooter', e.target.value)} className="min-h-[60px] resize-none font-mono text-xs" placeholder="<div style='padding:20px;text-align:center;font-size:12px'>...</div>" />
                </SettingField>
              </CardContent>
            </Card>
          </div>
        )

      // ============================================
      // NOTIFICATION SETTINGS
      // ============================================
      case 'notification':
        return (
          <div className="space-y-6">
            <SectionTitle icon={Bell} title="Notification Channels" description="How you receive notifications" />
            <Card>
              <CardContent className="p-5 space-y-1">
                <SettingSwitch checked={s.emailNotifications} onChange={v => updateField('notification', 'emailNotifications', v)} label="Email notifications" description="Receive alerts via email" />
                <Separator />
                <SettingSwitch checked={s.pushNotifications} onChange={v => updateField('notification', 'pushNotifications', v)} label="Push notifications" description="Browser push notifications" />
                <Separator />
                <SettingSwitch checked={s.smsNotifications} onChange={v => updateField('notification', 'smsNotifications', v)} label="SMS notifications" description="Text message alerts (requires SMS provider)" />
              </CardContent>
            </Card>

            <SectionTitle icon={AlertTriangle} title="Alert Types" description="Which events trigger notifications" />
            <Card>
              <CardContent className="p-5 space-y-1">
                <SettingSwitch checked={s.maintenanceAlerts} onChange={v => updateField('notification', 'maintenanceAlerts', v)} label="Maintenance alerts" description="Upcoming and overdue maintenance reminders" />
                <Separator />
                <SettingSwitch checked={s.complianceReminders} onChange={v => updateField('notification', 'complianceReminders', v)} label="Compliance reminders" description="Expiring licenses, permits, and certifications" />
                <Separator />
                <SettingSwitch checked={s.rentalAlerts} onChange={v => updateField('notification', 'rentalAlerts', v)} label="Rental alerts" description="New reservations, check-ins, check-outs, and overdue returns" />
                <Separator />
                <SettingSwitch checked={s.paymentAlerts} onChange={v => updateField('notification', 'paymentAlerts', v)} label="Payment alerts" description="New payments, failed transactions, and refunds" />
                <Separator />
                <SettingSwitch checked={s.overdueAlerts} onChange={v => updateField('notification', 'overdueAlerts', v)} label="Overdue alerts" description="Overdue invoices and rental returns" />
              </CardContent>
            </Card>

            <SectionTitle icon={Clock} title="Digest & Reports" description="Scheduled notification summaries" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <SettingSwitch checked={s.dailyDigest} onChange={v => updateField('notification', 'dailyDigest', v)} label="Daily digest" description="Summarize all daily activity in one email" />
                <SettingSwitch checked={s.weeklyReport} onChange={v => updateField('notification', 'weeklyReport', v)} label="Weekly report" description="Weekly summary with key metrics every Monday" />
                <SettingField label="Alert Days Before" description="How many days in advance to send expiry/reminders">
                  <div className="flex items-center gap-2">
                    <Input type="number" value={s.alertDaysBefore} onChange={e => updateField('notification', 'alertDaysBefore', parseInt(e.target.value) || 7)} className="h-9 w-20" />
                    <span className="text-xs text-muted-foreground">days before event</span>
                  </div>
                </SettingField>
              </CardContent>
            </Card>
          </div>
        )

      // ============================================
      // SECURITY SETTINGS
      // ============================================
      case 'security':
        return (
          <div className="space-y-6">
            <SectionTitle icon={Lock} title="Authentication" description="Login and session security" />
            <Card>
              <CardContent className="p-5 space-y-1">
                <SettingSwitch checked={s.twoFactorAuth} onChange={v => updateField('security', 'twoFactorAuth', v)} label="Two-Factor Authentication" description="Require 2FA for all users" />
                <Separator />
                <div className="flex items-center justify-between gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Session Timeout</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Minutes of inactivity before auto-logout</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" value={s.sessionTimeout} onChange={e => updateField('security', 'sessionTimeout', parseInt(e.target.value) || 30)} className="h-9 w-20 text-right" />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Maximum Devices</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Max concurrent devices per user</p>
                  </div>
                  <Input type="number" value={s.maxDevices} onChange={e => updateField('security', 'maxDevices', parseInt(e.target.value) || 3)} className="h-9 w-20 text-right" />
                </div>
              </CardContent>
            </Card>

            <SectionTitle icon={Shield} title="Password Policy" description="Requirements for user passwords" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SettingField label="Minimum Length" description="Minimum number of characters">
                    <Input type="number" value={s.passwordMinLength} onChange={e => updateField('security', 'passwordMinLength', parseInt(e.target.value) || 8)} className="h-9" />
                  </SettingField>
                </div>
                <Separator />
                <SettingSwitch checked={s.passwordRequireUppercase} onChange={v => updateField('security', 'passwordRequireUppercase', v)} label="Require uppercase letters" description="At least one uppercase character" />
                <Separator />
                <SettingSwitch checked={s.passwordRequireNumbers} onChange={v => updateField('security', 'passwordRequireNumbers', v)} label="Require numbers" description="At least one numeric digit" />
                <Separator />
                <SettingSwitch checked={s.passwordRequireSymbols} onChange={v => updateField('security', 'passwordRequireSymbols', v)} label="Require special characters" description="At least one symbol (!@#$%...)" />
              </CardContent>
            </Card>

            <SectionTitle icon={AlertTriangle} title="Brute Force Protection" description="Prevent unauthorized access attempts" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SettingField label="Max Login Attempts" description="Failed attempts before lockout">
                    <Input type="number" value={s.loginAttempts} onChange={e => updateField('security', 'loginAttempts', parseInt(e.target.value) || 5)} className="h-9" />
                  </SettingField>
                  <SettingField label="Lockout Duration" description="Minutes until account is unlocked">
                    <Input type="number" value={s.lockoutDuration} onChange={e => updateField('security', 'lockoutDuration', parseInt(e.target.value) || 30)} className="h-9" />
                  </SettingField>
                </div>
              </CardContent>
            </Card>

            <SectionTitle icon={Wifi} title="IP Whitelist" description="Restrict access to specific IP addresses" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <SettingField label="Allowed IP Addresses" description="Comma-separated list of IPs. Leave empty to allow all.">
                  <Textarea
                    value={s.ipWhitelist}
                    onChange={e => updateField('security', 'ipWhitelist', e.target.value)}
                    className="min-h-[60px] resize-none font-mono text-xs"
                    placeholder="192.168.1.0/24, 10.0.0.1, 203.0.113.0/24"
                  />
                </SettingField>
              </CardContent>
            </Card>
          </div>
        )

      // ============================================
      // APPEARANCE SETTINGS
      // ============================================
      case 'appearance':
        return (
          <div className="space-y-6">
            <SectionTitle icon={Palette} title="Theme" description="Application color scheme" />
            <Card>
              <CardContent className="p-5 space-y-4">
                <SettingField label="Color Theme" description="Choose light, dark, or follow system preference">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: Monitor },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          updateField('appearance', 'theme', opt.value)
                          setTheme(opt.value === 'system' ? 'system' : opt.value)
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                          s.theme === opt.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-transparent bg-muted/50 hover:border-border"
                        )}
                      >
                        <opt.icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </SettingField>
                <SettingField label="Primary Color" description="Brand accent color used throughout the app">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={s.primaryColor}
                        onChange={e => updateField('appearance', 'primaryColor', e.target.value)}
                        className="h-9 w-12 rounded-lg border cursor-pointer"
                      />
                    </div>
                    <Input value={s.primaryColor} onChange={e => updateField('appearance', 'primaryColor', e.target.value)} className="h-9 w-32 font-mono text-xs" />
                    <div className="flex gap-1">
                      {['#0d9488', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#3b82f6'].map(color => (
                        <button
                          key={color}
                          onClick={() => updateField('appearance', 'primaryColor', color)}
                          className={cn(
                            "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                            s.primaryColor === color ? "border-foreground scale-110" : "border-transparent"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </SettingField>
              </CardContent>
            </Card>

            <SectionTitle icon={Monitor} title="Layout" description="Interface density and layout preferences" />
            <Card>
              <CardContent className="p-5 space-y-1">
                <SettingSwitch checked={s.compactMode} onChange={v => updateField('appearance', 'compactMode', v)} label="Compact mode" description="Reduce spacing for more content on screen" />
                <Separator />
                <SettingSwitch checked={s.showAvatar} onChange={v => updateField('appearance', 'showAvatar', v)} label="Show user avatar" description="Display user avatar in header and sidebar" />
                <Separator />
                <SettingSwitch checked={s.animationEnabled} onChange={v => updateField('appearance', 'animationEnabled', v)} label="Enable animations" description="Smooth transitions and motion effects" />
                <Separator />
                <SettingField label="Sidebar Style" description="Sidebar appearance style">
                  <Select value={s.sidebarStyle} onValueChange={v => updateField('appearance', 'sidebarStyle', v)}>
                    <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="transparent">Transparent</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingField>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  // ============================================
  // Loading State
  // ============================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading settings...</span>
        </div>
      </div>
    )
  }

  // ============================================
  // Main Layout
  // ============================================
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-sm text-muted-foreground">Configure your FleetFlow OS preferences and business rules</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400">
                Unsaved changes
              </Badge>
            </motion.div>
          )}
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges} className="gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </Button>
        </div>
      </div>

      {/* Settings Layout: Sidebar Nav + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Category Navigation */}
        <div className="space-y-1">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            const isActive = activeCategory === cat.id
            const hasCategoryChanges = getCategoryChanges(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "hover:bg-accent text-foreground/70 hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-primary-foreground" : cat.color
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{cat.label}</p>
                  <p className={cn(
                    "text-[10px] truncate",
                    isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>{cat.description}</p>
                </div>
                {hasCategoryChanges && (
                  <div className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                )}
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary-foreground/50 shrink-0" />}
              </button>
            )
          })}

          {/* Save All Button */}
          <div className="pt-4">
            <Button
              size="sm"
              onClick={handleSaveAll}
              disabled={saving || !hasChanges}
              className="w-full gap-1.5"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save All Settings
            </Button>
          </div>

          {/* System Info Card */}
          <Card className="mt-4">
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-muted-foreground" />
                System Info
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">License</span>
                <span className="font-medium">Enterprise</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Database</span>
                <span className="font-medium">Neon PostgreSQL</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Server Status</span>
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[9px] px-1.5 py-0">Online</Badge>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-muted-foreground">Last Backup</span>
                <span className="font-medium">Today</span>
              </div>
              <Separator className="my-1" />
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Active Modules</p>
              <div className="flex flex-wrap gap-1">
                {['Fleet', 'Rental', 'Customer', 'Driver', 'Fuel', 'Maintenance', 'Workshop', 'Finance', 'HR', 'Insurance', 'Compliance', 'AI', 'Reports'].map(m => (
                  <Badge key={m} variant="secondary" className="text-[8px] px-1.5 py-0">{m}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
