'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import {
  Building2, Users, UserX, UserPlus, Search, Plus, Pencil, Trash2, Ban, CheckCircle2,
  Phone, Mail, Globe, MoreHorizontal, Eye, Loader2, CreditCard, Package, Database,
  Shield, Car, ClipboardCheck, CalendarDays, Fuel, Wrench, UsersRound, Route, FileText,
  DollarSign, Percent, Hash, KeyRound, Server, CheckCircle, XCircle, AlertCircle,
  ChevronDown, ChevronRight, Sparkles, Crown, Zap, ArrowRight, CircleDollarSign,
  ArrowLeftRight, TrendingDown, Wallet
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Client {
  id: string
  companyName: string
  slug: string
  contactPerson: string
  email: string
  phone: string | null
  country: string | null
  industryType: string | null
  subscriptionPlan: string
  licenseStatus: string
  status: string
  notes: string | null
  tenantId: string | null
  createdAt: string
  subscription?: { planType: string; status: string; price: number; activeModules: string; discount: number; currency?: string } | null
  license?: { licenseKey: string; status: string } | null
  activities?: { action: string; details: string | null; createdAt: string }[]
}

interface Stats {
  total: number
  active: number
  suspended: number
  newThisMonth: number
}

// ============================================
// Multi-Currency Configuration
// ============================================
const CURRENCIES: Record<string, { symbol: string; name: string; flag: string; rate: number }> = {
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸', rate: 1 },
  EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺', rate: 0.92 },
  GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧', rate: 0.79 },
  AED: { symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪', rate: 3.67 },
  SAR: { symbol: '﷼', name: 'Saudi Riyal', flag: '🇸🇦', rate: 3.75 },
  PKR: { symbol: '₨', name: 'Pakistani Rupee', flag: '🇵🇰', rate: 278.50 },
  INR: { symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', rate: 83.12 },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', rate: 1.37 },
  AUD: { symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', rate: 1.53 },
  TRY: { symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷', rate: 32.45 },
  QAR: { symbol: '﷼', name: 'Qatari Riyal', flag: '🇶🇦', rate: 3.64 },
  KWD: { symbol: 'د.ك', name: 'Kuwaiti Dinar', flag: '🇰🇼', rate: 0.31 },
  BHD: { symbol: 'د.ب', name: 'Bahraini Dinar', flag: '🇧🇭', rate: 0.38 },
  OMR: { symbol: '﷼', name: 'Omani Rial', flag: '🇴🇲', rate: 0.38 },
  MYR: { symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾', rate: 4.71 },
}

// Convert USD amount to selected currency
function convertCurrency(usdAmount: number, currency: string): number {
  const rate = CURRENCIES[currency]?.rate || 1
  return usdAmount * rate
}

// Format currency value
function formatCurrency(amount: number, currency: string): string {
  const curr = CURRENCIES[currency]
  if (!curr) return `$${amount.toFixed(2)}`
  const converted = amount * curr.rate
  // For high-value currencies like PKR, INR, TRY - no decimals
  if (curr.rate > 50) return `${curr.symbol}${Math.round(converted).toLocaleString()}`
  // For normal currencies - 2 decimals
  return `${curr.symbol}${converted.toFixed(2)}`
}

// ============================================
// Module Definitions (prices in USD)
// ============================================
const ERP_MODULES = [
  { id: 'fleet', label: 'Fleet Management', icon: Car, description: 'Vehicle inventory, tracking & status', price: 49 },
  { id: 'rental', label: 'Rental Operations', icon: CalendarDays, description: 'Reservations, contracts & deposits', price: 39 },
  { id: 'customer', label: 'Customer CRM', icon: UsersRound, description: 'Customer profiles & history', price: 29 },
  { id: 'driver', label: 'Driver Management', icon: Users, description: 'Driver profiles, licenses & ratings', price: 29 },
  { id: 'transport', label: 'Transport & Dispatch', icon: Route, description: 'Dispatch orders, trips & GPS', price: 49 },
  { id: 'fuel', label: 'Fuel Management', icon: Fuel, description: 'Fuel tracking, costs & analytics', price: 19 },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, description: 'Service records, workshop & parts', price: 39 },
  { id: 'finance', label: 'Finance & Accounting', icon: DollarSign, description: 'Invoices, payments & journals', price: 49 },
  { id: 'insurance', label: 'Insurance', icon: Shield, description: 'Policy management & claims', price: 19 },
  { id: 'hr', label: 'HR & Payroll', icon: Users, description: 'Employees, attendance & payroll', price: 39 },
  { id: 'compliance', label: 'Compliance', icon: ClipboardCheck, description: 'Regulatory docs & tracking', price: 19 },
  { id: 'documents', label: 'Document Center', icon: FileText, description: 'Centralized document storage', price: 9 },
]

// Plan pricing (in USD)
const PLAN_CONFIG: Record<string, { label: string; basePrice: number; months: number; discount: number; color: string; icon: React.ReactNode; description: string }> = {
  trial: { label: 'Trial', basePrice: 0, months: 1, discount: 0, color: 'text-gray-500', icon: <Zap className="h-4 w-4" />, description: '14-day free trial with limited features' },
  monthly: { label: 'Monthly', basePrice: 99, months: 1, discount: 0, color: 'text-blue-500', icon: <CalendarDays className="h-4 w-4" />, description: 'Billed monthly, cancel anytime' },
  annual: { label: 'Annual', basePrice: 999, months: 12, discount: 16, color: 'text-purple-500', icon: <Crown className="h-4 w-4" />, description: 'Billed annually, save 16%' },
  enterprise: { label: 'Enterprise', basePrice: 2499, months: 12, discount: 25, color: 'text-amber-500', icon: <Sparkles className="h-4 w-4" />, description: 'Custom limits, priority support' },
}

// Country → Currency mapping
const COUNTRY_CURRENCY: Record<string, string> = {
  'United States': 'USD', 'United Kingdom': 'GBP', 'UAE': 'AED', 'Saudi Arabia': 'SAR',
  'Pakistan': 'PKR', 'India': 'INR', 'Canada': 'CAD', 'Australia': 'AUD',
  'Germany': 'EUR', 'Qatar': 'QAR', 'Kuwait': 'KWD', 'Bahrain': 'BHD',
  'Oman': 'OMR', 'Malaysia': 'MYR', 'Turkey': 'TRY',
}

const emptyForm = {
  companyName: '', contactPerson: '', email: '', phone: '', country: '',
  industryType: '', subscriptionPlan: 'trial', licenseStatus: 'active', notes: '',
  // Currency
  currency: 'USD',
  // Modules
  selectedModules: ['fleet', 'rental', 'customer', 'driver'] as string[],
  discount: 0,
  discountType: 'percentage' as 'percentage' | 'fixed',
  // Admin user creation
  adminName: '', adminEmail: '', adminPassword: '', createAdminUser: true,
  // Tenant DB
  autoProvisionDB: true,
  domain: '',
  address: '', city: '', state: '', zipCode: '',
  // Billing
  billingCycle: 'monthly' as 'monthly' | 'annual',
  paymentMethod: 'invoice' as 'card' | 'bank_transfer' | 'invoice',
}

export default function OwnerClientsPage() {
  const [data, setData] = useState<Client[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, suspended: 0, newThisMonth: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [activityClient, setActivityClient] = useState<Client | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['company', 'contact', 'modules', 'pricing', 'billing', 'user', 'tenant']))
  const { addNotification } = useAppStore()

  useEffect(() => { fetchData() }, [search, statusFilter])

  // Auto-set currency when country changes
  useEffect(() => {
    if (formData.country && COUNTRY_CURRENCY[formData.country]) {
      setFormData(prev => ({ ...prev, currency: COUNTRY_CURRENCY[formData.country] }))
    }
  }, [formData.country])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/fleet/clients?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data || [])
        setStats(json.stats || { total: 0, active: 0, suspended: 0, newThisMonth: 0 })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // Pricing calculations (all in USD, then convert)
  // ============================================
  const pricing = useMemo(() => {
    const plan = PLAN_CONFIG[formData.subscriptionPlan] || PLAN_CONFIG.trial
    const modulePrices = ERP_MODULES
      .filter(m => formData.selectedModules.includes(m.id))
      .reduce((sum, m) => sum + m.price, 0)
    const subtotal = plan.basePrice + modulePrices
    const planDiscount = plan.discount / 100
    const afterPlanDiscount = subtotal * (1 - planDiscount)

    let customDiscount = 0
    if (formData.discountType === 'percentage') {
      customDiscount = afterPlanDiscount * (formData.discount / 100)
    } else {
      // Fixed discount is in the selected currency, convert back to USD for calculation
      const fixedInUsd = formData.discount / (CURRENCIES[formData.currency]?.rate || 1)
      customDiscount = Math.min(fixedInUsd, afterPlanDiscount)
    }
    const totalUSD = afterPlanDiscount - customDiscount
    const monthlyEquivUSD = plan.months > 1 ? totalUSD / plan.months : totalUSD

    const curr = formData.currency
    const totalLocal = convertCurrency(totalUSD, curr)
    const monthlyEquivLocal = convertCurrency(monthlyEquivUSD, curr)
    const subtotalLocal = convertCurrency(subtotal, curr)
    const planDiscountLocal = convertCurrency(subtotal * planDiscount, curr)
    const customDiscountLocal = convertCurrency(customDiscount, curr)

    return {
      subtotalUSD: subtotal, planDiscountAmountUSD: subtotal * planDiscount, afterPlanDiscount,
      customDiscountUSD: customDiscount, totalUSD, monthlyEquivUSD,
      subtotalLocal, planDiscountLocal, customDiscountLocal, totalLocal, monthlyEquivLocal,
      moduleCount: formData.selectedModules.length,
      moduleTotalUSD: modulePrices,
      moduleTotalLocal: convertCurrency(modulePrices, curr),
      planBaseLocal: convertCurrency(plan.basePrice, curr),
    }
  }, [formData.subscriptionPlan, formData.selectedModules, formData.discount, formData.discountType, formData.currency])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }

  const toggleModule = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedModules: prev.selectedModules.includes(moduleId)
        ? prev.selectedModules.filter(id => id !== moduleId)
        : [...prev.selectedModules, moduleId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.selectedModules.length === 0) {
      toast.error('Please select at least one module')
      return
    }
    if (formData.createAdminUser && (!formData.adminName || !formData.adminEmail || !formData.adminPassword)) {
      toast.error('Please fill in all admin user fields')
      return
    }
    if (formData.createAdminUser && formData.adminPassword.length < 6) {
      toast.error('Admin password must be at least 6 characters')
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...formData,
        totalAmount: pricing.totalUSD,
        totalAmountLocal: pricing.totalLocal,
        monthlyEquivalent: pricing.monthlyEquivUSD,
        currency: formData.currency,
        exchangeRate: CURRENCIES[formData.currency]?.rate || 1,
      }
      const res = await fetch(`/api/fleet/clients`, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editId ? { id: editId, ...payload } : payload),
      })
      const json = await res.json()
      if (res.ok) {
        toast.success(editId ? 'Client updated successfully' : 'Client registered successfully', {
          description: editId ? undefined : `${formatCurrency(pricing.totalUSD, formData.currency)} ${formData.currency} | Tenant DB: ${json.dbName || 'pending'}`
        })
        addNotification({
          title: editId ? 'Client Updated' : 'Client Registered',
          message: `${formData.companyName} has been ${editId ? 'updated' : 'registered'}`,
          type: 'success'
        })
        fetchData()
        setOpen(false)
        setEditId(null)
        setFormData(emptyForm)
      } else {
        toast.error(json.error || 'Operation failed')
      }
    } catch (e) {
      toast.error('Operation failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client? This will also remove their subscription, license, and tenant database reference.')) return
    try {
      const res = await fetch(`/api/fleet/clients?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Client deleted')
        addNotification({ title: 'Client Deleted', message: 'Client has been removed', type: 'warning' })
        fetchData()
      }
    } catch (e) {
      toast.error('Failed to delete client')
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/fleet/clients`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        toast.success(`Client ${status === 'suspended' ? 'suspended' : 'reactivated'}`)
        addNotification({ title: 'Status Updated', message: `Client has been ${status}`, type: 'info' })
        fetchData()
      }
    } catch (e) {
      toast.error('Failed to update status')
    }
  }

  const openEdit = (client: Client) => {
    setEditId(client.id)
    const subModules = client.subscription?.activeModules
      ? (typeof client.subscription.activeModules === 'string'
        ? client.subscription.activeModules.split(',')
        : [])
      : ['fleet', 'rental', 'customer', 'driver']
    setFormData({
      companyName: client.companyName,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone || '',
      country: client.country || '',
      industryType: client.industryType || '',
      subscriptionPlan: client.subscriptionPlan,
      licenseStatus: client.licenseStatus,
      notes: client.notes || '',
      currency: client.subscription?.currency || COUNTRY_CURRENCY[client.country || ''] || 'USD',
      selectedModules: subModules,
      discount: client.subscription?.discount || 0,
      discountType: 'percentage',
      adminName: client.contactPerson,
      adminEmail: client.email,
      adminPassword: '',
      createAdminUser: false,
      autoProvisionDB: !client.tenantId,
      domain: '',
      address: '', city: '', state: '', zipCode: '',
      billingCycle: 'monthly',
      paymentMethod: 'invoice',
    })
    setOpen(true)
  }

  const openCreate = () => {
    setEditId(null)
    setFormData(emptyForm)
    setExpandedSections(new Set(['company', 'contact', 'modules', 'pricing', 'billing', 'user', 'tenant']))
    setOpen(true)
  }

  const slugPreview = formData.companyName
    ? `ff_${formData.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 20)}`
    : 'ff_...'

  const curr = CURRENCIES[formData.currency]
  const currSymbol = curr?.symbol || '$'
  const isLocalCurrency = formData.currency !== 'USD'

  const statCards = [
    { label: 'Total Clients', value: stats.total, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Active', value: stats.active, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Suspended', value: stats.suspended, icon: UserX, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
    { label: 'New This Month', value: stats.newThisMonth, icon: UserPlus, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
  ]

  const FormSection = ({ id, icon, title, description, children, required }: {
    id: string; icon: React.ReactNode; title: string; description: string; children: React.ReactNode; required?: boolean
  }) => {
    const isExpanded = expandedSections.has(id)
    return (
      <div className="border border-border/60 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection(id)}
          className="w-full flex items-center gap-3 px-5 py-3.5 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary shrink-0">
            {icon}
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              {required && <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">REQUIRED</span>}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
          </div>
          <motion.div animate={{ rotate: isExpanded ? 0 : -90 }} transition={{ duration: 0.15 }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </button>
        {isExpanded && (
          <div className="px-5 py-4 space-y-4">
            {children}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                <div className={`p-1.5 rounded-md ${s.bg}`}>
                  <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Client Management</CardTitle>
              <CardDescription>Manage all enterprise clients and their subscriptions</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search clients..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 h-9 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" className="h-9" onClick={openCreate}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Client
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[520px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Company</TableHead>
                  <TableHead className="text-xs">Contact</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Phone</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Country</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Industry</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Plan</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">License</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted rounded w-20 animate-pulse" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      No clients found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((client) => (
                    <TableRow key={client.id} className="hover:bg-accent/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {client.companyName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{client.companyName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{client.contactPerson}</TableCell>
                      <TableCell className="text-xs">{client.email}</TableCell>
                      <TableCell className="text-xs hidden lg:table-cell">{client.phone || '—'}</TableCell>
                      <TableCell className="text-xs hidden md:table-cell">{client.country || '—'}</TableCell>
                      <TableCell className="text-xs hidden md:table-cell">{client.industryType || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline" className="text-[10px] capitalize">{client.subscriptionPlan}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={client.licenseStatus === 'active' ? 'default' : 'destructive'} className="text-[10px] capitalize">
                          {client.licenseStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.status === 'active' ? 'default' : 'destructive'} className="text-[10px] capitalize">
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(client)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setActivityClient(client)}>
                              <Eye className="mr-2 h-3.5 w-3.5" /> View Activity
                            </DropdownMenuItem>
                            {client.status === 'active' ? (
                              <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'suspended')}>
                                <Ban className="mr-2 h-3.5 w-3.5" /> Suspend
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleStatusChange(client.id, 'active')}>
                                <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Reactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(client.id)}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* Add/Edit Dialog — Wide + Multi-Currency      */}
      {/* ============================================ */}
      <Dialog open={open} onOpenChange={(v) => { if (!saving) setOpen(v) }}>
        <DialogContent className="max-w-[1400px] w-[95vw] max-h-[94vh] p-0 gap-0">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">{editId ? 'Edit Client' : 'Register New Enterprise Client'}</DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    {editId ? 'Update client information, subscription and settings' : 'Complete all sections to register a new client with subscription, admin user & tenant database'}
                  </DialogDescription>
                </div>
              </div>
              {/* Currency selector in header */}
              <div className="flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                  <SelectTrigger className="h-8 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURRENCIES).map(([code, c]) => (
                      <SelectItem key={code} value={code}>
                        <span className="flex items-center gap-1.5">
                          <span>{c.flag}</span>
                          <span className="font-semibold">{code}</span>
                          <span className="text-muted-foreground">({c.symbol})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Scrollable Form Body */}
          <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(94vh-140px)]">
            <div className="px-6 py-5 space-y-4">

              {/* Section 1: Company Information */}
              <FormSection id="company" icon={<Building2 className="h-4 w-4" />} title="Company Information" description="Business details and company profile" required>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Company Name *</Label>
                    <Input className="h-10" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} required placeholder="Enter company name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Industry *</Label>
                    <Select value={formData.industryType} onValueChange={(v) => setFormData({ ...formData, industryType: v })}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select industry" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Logistics">Logistics & Freight</SelectItem>
                        <SelectItem value="Transport">Transport & Transit</SelectItem>
                        <SelectItem value="Car Rental">Car Rental</SelectItem>
                        <SelectItem value="Fleet Management">Fleet Management</SelectItem>
                        <SelectItem value="Government">Government</SelectItem>
                        <SelectItem value="Construction">Construction</SelectItem>
                        <SelectItem value="Oil & Gas">Oil & Gas</SelectItem>
                        <SelectItem value="Hospitality">Hospitality</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Country</Label>
                    <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select country" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="United States">🇺🇸 United States</SelectItem>
                        <SelectItem value="United Kingdom">🇬🇧 United Kingdom</SelectItem>
                        <SelectItem value="UAE">🇦🇪 UAE</SelectItem>
                        <SelectItem value="Saudi Arabia">🇸🇦 Saudi Arabia</SelectItem>
                        <SelectItem value="Pakistan">🇵🇰 Pakistan</SelectItem>
                        <SelectItem value="India">🇮🇳 India</SelectItem>
                        <SelectItem value="Canada">🇨🇦 Canada</SelectItem>
                        <SelectItem value="Australia">🇦🇺 Australia</SelectItem>
                        <SelectItem value="Germany">🇩🇪 Germany</SelectItem>
                        <SelectItem value="Qatar">🇶🇦 Qatar</SelectItem>
                        <SelectItem value="Kuwait">🇰🇼 Kuwait</SelectItem>
                        <SelectItem value="Bahrain">🇧🇭 Bahrain</SelectItem>
                        <SelectItem value="Oman">🇴🇲 Oman</SelectItem>
                        <SelectItem value="Malaysia">🇲🇾 Malaysia</SelectItem>
                        <SelectItem value="Turkey">🇹🇷 Turkey</SelectItem>
                        <SelectItem value="Other">🌍 Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Billing Currency</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border bg-muted/30">
                      <span className="text-sm">{curr?.flag}</span>
                      <span className="text-xs font-semibold ml-2">{formData.currency}</span>
                      <span className="text-[10px] text-muted-foreground ml-1">({currSymbol})</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">Auto from country</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Address</Label>
                    <Input className="h-10" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Street address" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">City</Label>
                    <Input className="h-10" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">State</Label>
                    <Input className="h-10" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="State" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Zip Code</Label>
                    <Input className="h-10" value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} placeholder="Code" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Domain</Label>
                    <div className="flex items-center gap-1">
                      <Input className="h-10 flex-1" value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} placeholder="company-name" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">.fleetflow.app</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Notes</Label>
                    <Input className="h-10" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes..." />
                  </div>
                </div>
              </FormSection>

              {/* Section 2: Contact Details */}
              <FormSection id="contact" icon={<Phone className="h-4 w-4" />} title="Contact Details" description="Primary contact person and communication info" required>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Contact Person *</Label>
                    <Input className="h-10" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} required placeholder="Full name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Email *</Label>
                    <Input type="email" className="h-10" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required placeholder="contact@company.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Phone *</Label>
                    <Input className="h-10" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
              </FormSection>

              {/* Section 3: Module Selection */}
              <FormSection id="modules" icon={<Package className="h-4 w-4" />} title="Module Selection" description={`Choose which ERP modules to enable (${formData.selectedModules.length} of ${ERP_MODULES.length} selected) • Prices in ${formData.currency}`} required>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {ERP_MODULES.map((mod) => {
                    const isSelected = formData.selectedModules.includes(mod.id)
                    const ModIcon = mod.icon
                    const localPrice = convertCurrency(mod.price, formData.currency)
                    return (
                      <button
                        key={mod.id}
                        type="button"
                        onClick={() => toggleModule(mod.id)}
                        className={cn(
                          "flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all text-left",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border/50 hover:border-border bg-background hover:bg-muted/30"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center h-9 w-9 rounded-lg shrink-0 transition-colors",
                          isSelected ? "bg-primary/15 text-primary" : "bg-muted/50 text-muted-foreground"
                        )}>
                          <ModIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={cn("text-xs font-semibold", isSelected ? "text-foreground" : "text-muted-foreground")}>{mod.label}</span>
                            <span className="text-[10px] font-bold text-primary">{currSymbol}{curr?.rate > 50 ? Math.round(localPrice) : localPrice.toFixed(0)}/mo</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{mod.description}</p>
                        </div>
                        <div className={cn(
                          "flex items-center justify-center h-5 w-5 rounded-md border-2 shrink-0 mt-0.5 transition-colors",
                          isSelected ? "bg-primary border-primary" : "border-border"
                        )}>
                          {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
                {/* Quick select */}
                <div className="flex items-center gap-2 pt-1">
                  <Button type="button" variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setFormData({ ...formData, selectedModules: ERP_MODULES.map(m => m.id) })}>
                    Select All
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setFormData({ ...formData, selectedModules: ['fleet', 'rental', 'customer', 'driver'] })}>
                    Core Modules
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setFormData({ ...formData, selectedModules: [] })}>
                    Clear All
                  </Button>
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {formData.selectedModules.length} modules selected • Module total: {formatCurrency(pricing.moduleTotalUSD, formData.currency)}/mo
                  </span>
                </div>
              </FormSection>

              {/* Section 4: Subscription & Pricing (Multi-Currency) */}
              <FormSection id="pricing" icon={<CreditCard className="h-4 w-4" />} title="Subscription & Pricing" description={`Plan selection, pricing breakdown & discount • All prices in ${formData.currency}`} required>
                {/* Plan Selection Cards — wider layout */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(PLAN_CONFIG).map(([key, plan]) => {
                    const localPrice = convertCurrency(plan.basePrice, formData.currency)
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, subscriptionPlan: key })}
                        className={cn(
                          "relative flex flex-col p-3.5 rounded-xl border-2 transition-all text-left",
                          formData.subscriptionPlan === key
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border/50 hover:border-border bg-background"
                        )}
                      >
                        {plan.discount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                            SAVE {plan.discount}%
                          </span>
                        )}
                        <div className={cn("flex items-center gap-1.5 mb-2", plan.color)}>
                          {plan.icon}
                          <span className="text-xs font-bold">{plan.label}</span>
                        </div>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-lg font-bold">{currSymbol}{curr?.rate > 50 ? Math.round(localPrice).toLocaleString() : localPrice.toFixed(0)}</span>
                          <span className="text-[10px] text-muted-foreground">/{plan.months > 1 ? 'yr' : 'mo'}</span>
                        </div>
                        {isLocalCurrency && (
                          <p className="text-[9px] text-muted-foreground">≈ ${plan.basePrice} USD</p>
                        )}
                        <p className="text-[9px] text-muted-foreground mt-1 leading-tight">{plan.description}</p>
                        {formData.subscriptionPlan === key && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* License Status + Discount + Currency */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">License Status</Label>
                    <Select value={formData.licenseStatus} onValueChange={(v) => setFormData({ ...formData, licenseStatus: v })}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Custom Discount</Label>
                    <div className="flex gap-2">
                      <Select value={formData.discountType} onValueChange={(v: any) => setFormData({ ...formData, discountType: v })}>
                        <SelectTrigger className="h-10 w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">%</SelectItem>
                          <SelectItem value="fixed">{currSymbol}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        className="h-10 flex-1"
                        min={0}
                        max={formData.discountType === 'percentage' ? 100 : undefined}
                        value={formData.discount || ''}
                        onChange={(e) => setFormData({ ...formData, discount: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Exchange Rate</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border bg-muted/30">
                      <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground mr-2" />
                      <span className="text-xs">1 USD = {curr?.rate || 1} {formData.currency}</span>
                      {isLocalCurrency && (
                        <Badge variant="outline" className="ml-2 text-[8px] h-4 px-1">LOCAL</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price Breakdown — Dual Currency */}
                <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price Breakdown</h4>
                    <div className="flex items-center gap-1 text-[10px]">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">All amounts in</span>
                      <span className="font-bold text-foreground">{formData.currency}</span>
                      {isLocalCurrency && <span className="text-muted-foreground ml-1">(USD in gray)</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Line items */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Base Plan ({PLAN_CONFIG[formData.subscriptionPlan]?.label})</span>
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(PLAN_CONFIG[formData.subscriptionPlan]?.basePrice || 0, formData.currency)}/mo</span>
                          {isLocalCurrency && <span className="text-[9px] text-muted-foreground ml-1">(${PLAN_CONFIG[formData.subscriptionPlan]?.basePrice})</span>}
                        </div>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Modules ({pricing.moduleCount} × selected)</span>
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(pricing.moduleTotalUSD, formData.currency)}/mo</span>
                          {isLocalCurrency && <span className="text-[9px] text-muted-foreground ml-1">(${pricing.moduleTotalUSD.toFixed(0)})</span>}
                        </div>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Subtotal</span>
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(pricing.subtotalUSD, formData.currency)}</span>
                          {isLocalCurrency && <span className="text-[9px] text-muted-foreground ml-1">(${pricing.subtotalUSD.toFixed(2)})</span>}
                        </div>
                      </div>
                      {PLAN_CONFIG[formData.subscriptionPlan]?.discount > 0 && (
                        <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400">
                          <span>Plan Discount ({PLAN_CONFIG[formData.subscriptionPlan]?.discount}%)</span>
                          <div className="text-right">
                            <span>-{formatCurrency(pricing.planDiscountAmountUSD, formData.currency)}</span>
                            {isLocalCurrency && <span className="text-[9px] opacity-70 ml-1">(-${pricing.planDiscountAmountUSD.toFixed(2)})</span>}
                          </div>
                        </div>
                      )}
                      {pricing.customDiscountUSD > 0 && (
                        <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400">
                          <span>Custom Discount {formData.discountType === 'percentage' ? `(${formData.discount}%)` : `(${currSymbol}${formData.discount})`}</span>
                          <div className="text-right">
                            <span>-{formatCurrency(pricing.customDiscountUSD, formData.currency)}</span>
                            {isLocalCurrency && <span className="text-[9px] opacity-70 ml-1">(-${pricing.customDiscountUSD.toFixed(2)})</span>}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Total */}
                    <div className="flex flex-col justify-center items-center bg-background rounded-xl p-5 border border-border/50">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Amount</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary">{formatCurrency(pricing.totalUSD, formData.currency)}</span>
                        <span className="text-sm font-semibold text-muted-foreground">{formData.currency}</span>
                      </div>
                      {isLocalCurrency && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">≈ ${pricing.totalUSD.toFixed(2)} USD</span>
                        </div>
                      )}
                      {PLAN_CONFIG[formData.subscriptionPlan]?.months > 1 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          ≈ {formatCurrency(pricing.monthlyEquivUSD, formData.currency)}/mo
                          {isLocalCurrency && <span className="ml-1">(${pricing.monthlyEquivUSD.toFixed(2)} USD)</span>}
                        </div>
                      )}
                      {isLocalCurrency && (
                        <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                          <TrendingDown className="h-3 w-3 text-amber-600" />
                          <span className="text-[10px] text-amber-700 dark:text-amber-400">Rate: 1 USD = {curr?.rate} {formData.currency}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* Section 5: Billing & Payment */}
              <FormSection id="billing" icon={<Wallet className="h-4 w-4" />} title="Billing & Payment" description="Payment method and billing preferences">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Billing Cycle</Label>
                    <Select value={formData.billingCycle} onValueChange={(v: any) => setFormData({ ...formData, billingCycle: v })}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="annual">Annual (Save 16%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Payment Method</Label>
                    <Select value={formData.paymentMethod} onValueChange={(v: any) => setFormData({ ...formData, paymentMethod: v })}>
                      <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoice">Invoice / Bank Transfer</SelectItem>
                        <SelectItem value="card">Credit / Debit Card</SelectItem>
                        <SelectItem value="bank_transfer">Direct Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Invoice Currency</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border bg-muted/30">
                      <span className="text-sm">{curr?.flag}</span>
                      <span className="text-xs font-semibold ml-2">{formData.currency} — {curr?.name}</span>
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* Section 6: Admin User Creation */}
              <FormSection id="user" icon={<Shield className="h-4 w-4" />} title="Admin User Creation" description="Create the primary admin account for this client" required>
                <div className="flex items-center gap-3 mb-4">
                  <Switch
                    checked={formData.createAdminUser}
                    onCheckedChange={(v) => setFormData({ ...formData, createAdminUser: v })}
                  />
                  <div>
                    <span className="text-xs font-medium">Create admin user automatically</span>
                    <p className="text-[10px] text-muted-foreground">A client_owner account will be created with full access</p>
                  </div>
                </div>
                {formData.createAdminUser && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Admin Name *</Label>
                      <Input className="h-10" value={formData.adminName} onChange={(e) => setFormData({ ...formData, adminName: e.target.value })} placeholder="Admin full name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Admin Email *</Label>
                      <Input type="email" className="h-10" value={formData.adminEmail} onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })} placeholder="admin@company.com" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Password *</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input type="password" className="h-10 pl-8" value={formData.adminPassword} onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })} placeholder="Min 6 characters" />
                      </div>
                    </div>
                  </div>
                )}
                {formData.createAdminUser && (
                  <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Hash className="h-3 w-3" />
                      <span>Role: <span className="font-semibold text-foreground">client_owner</span></span>
                      <span className="mx-1">•</span>
                      <span>Access: <span className="font-semibold text-foreground">Full Admin Panel</span></span>
                      <span className="mx-1">•</span>
                      <span>Auto-login: <span className="font-semibold text-emerald-600">Enabled</span></span>
                    </div>
                  </div>
                )}
              </FormSection>

              {/* Section 7: Tenant Database */}
              <FormSection id="tenant" icon={<Database className="h-4 w-4" />} title="Tenant Database" description="Auto-provision a dedicated PostgreSQL database for this client">
                <div className="flex items-center gap-3 mb-4">
                  <Switch
                    checked={formData.autoProvisionDB}
                    onCheckedChange={(v) => setFormData({ ...formData, autoProvisionDB: v })}
                  />
                  <div>
                    <span className="text-xs font-medium">Auto-provision tenant database</span>
                    <p className="text-[10px] text-muted-foreground">Creates a dedicated database on Neon PostgreSQL</p>
                  </div>
                </div>
                {formData.autoProvisionDB && (
                  <div className="bg-muted/30 rounded-xl p-4 border border-border/50 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Database Name</Label>
                        <div className="flex items-center h-10 px-3 rounded-md border border-border bg-background">
                          <Server className="h-3.5 w-3.5 text-muted-foreground mr-2" />
                          <span className="text-xs font-mono text-muted-foreground">{slugPreview}</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Host</Label>
                        <div className="flex items-center h-10 px-3 rounded-md border border-border bg-background">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground mr-2" />
                          <span className="text-xs font-mono text-muted-foreground">ep-lucky-fog-ap5pa8qr-pooler.c-7.us-east-1.aws.neon.tech</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 pt-1">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Provisioning Steps</h5>
                      <div className="flex items-center gap-2 text-[11px]">
                        <ArrowRight className="h-3 w-3 text-primary" />
                        <span>Create database <span className="font-mono font-semibold">{slugPreview}</span> on Neon</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <ArrowRight className="h-3 w-3 text-primary" />
                        <span>Run schema migration (prisma db push)</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <ArrowRight className="h-3 w-3 text-primary" />
                        <span>Mark tenant as dbReady in central DB</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <ArrowRight className="h-3 w-3 text-primary" />
                        <span>Create admin user in tenant database</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-[10px] text-amber-600 dark:text-amber-400">Database provisioning may take 30-60 seconds</span>
                    </div>
                  </div>
                )}
              </FormSection>

            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[10px] text-muted-foreground">7 sections</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] text-muted-foreground">{formData.selectedModules.length} modules</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CircleDollarSign className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[10px] font-bold text-foreground">{formatCurrency(pricing.totalUSD, formData.currency)} {formData.currency}</span>
                  {isLocalCurrency && <span className="text-[9px] text-muted-foreground">(${pricing.totalUSD.toFixed(2)} USD)</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
                <Button type="submit" size="sm" disabled={saving} className="min-w-[120px]">
                  {saving ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Processing...</>
                  ) : editId ? (
                    <><Pencil className="h-3.5 w-3.5 mr-1.5" /> Update Client</>
                  ) : (
                    <><Plus className="h-3.5 w-3.5 mr-1.5" /> Register Client</>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Activity Dialog */}
      <Dialog open={!!activityClient} onOpenChange={() => setActivityClient(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Activity - {activityClient?.companyName}</DialogTitle>
            <DialogDescription>Recent activity log for this client</DialogDescription>
          </DialogHeader>
          {activityClient?.activities && activityClient.activities.length > 0 ? (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {activityClient.activities.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-md hover:bg-accent">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{a.action}</p>
                      <p className="text-[11px] text-muted-foreground">{a.details || 'No details'}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No activity recorded</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
