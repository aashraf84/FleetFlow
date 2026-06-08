'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import {
  CreditCard, CheckCircle, AlertTriangle, DollarSign, Search, Plus, Pencil, Trash2,
  ArrowUpRight, ArrowDownRight, Clock, RefreshCw, Ban, MoreHorizontal
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip, Legend } from 'recharts'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6']

interface Subscription {
  id: string
  clientId: string
  planType: string
  startDate: string
  expiryDate: string
  renewalDate: string | null
  autoRenewal: boolean
  price: number
  currency: string
  status: string
  userLimit: number
  storageLimit: number
  activeModules: string
  client: { companyName: string; contactPerson: string; email: string } | null
}

interface Stats {
  total: number
  active: number
  expiringSoon: number
  revenue: number
}

const emptyForm = {
  clientId: '', planType: 'monthly', startDate: '', expiryDate: '', autoRenewal: false,
  price: 299, currency: 'USD', userLimit: 5, storageLimit: 512, activeModules: 'fleet,rental,customer,driver',
}

export default function OwnerSubscriptionsPage() {
  const [data, setData] = useState<Subscription[]>([])
  const [clients, setClients] = useState<{ id: string; companyName: string }[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, expiringSoon: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const { addNotification } = useAppStore()

  useEffect(() => { fetchData() }, [search, statusFilter])
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch('/api/fleet/clients')
        if (res.ok) {
          const json = await res.json()
          setClients((json.data || []).map((c: any) => ({ id: c.id, companyName: c.companyName })))
        }
      } catch (e) { console.error(e) }
    }
    fetchClients()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/fleet/subscriptions?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data || [])
        setStats(json.stats || { total: 0, active: 0, expiringSoon: 0, revenue: 0 })
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/fleet/subscriptions`, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editId ? { id: editId, ...formData } : formData),
      })
      if (res.ok) {
        toast.success(editId ? 'Subscription updated' : 'Subscription created')
        addNotification({ title: 'Subscription Updated', message: `Subscription has been ${editId ? 'updated' : 'created'}`, type: 'success' })
        fetchData()
        setOpen(false)
        setEditId(null)
        setFormData(emptyForm)
      }
    } catch (e) { toast.error('Operation failed') }
  }

  const handleAction = async (id: string, updates: Partial<Subscription>) => {
    try {
      const res = await fetch(`/api/fleet/subscriptions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      if (res.ok) {
        toast.success('Subscription updated')
        fetchData()
      }
    } catch (e) { toast.error('Failed to update subscription') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subscription?')) return
    try {
      const res = await fetch(`/api/fleet/subscriptions?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Deleted'); fetchData() }
    } catch (e) { toast.error('Failed to delete') }
  }

  const openEdit = (sub: Subscription) => {
    setEditId(sub.id)
    setFormData({
      clientId: sub.clientId,
      planType: sub.planType,
      startDate: sub.startDate ? new Date(sub.startDate).toISOString().split('T')[0] : '',
      expiryDate: sub.expiryDate ? new Date(sub.expiryDate).toISOString().split('T')[0] : '',
      autoRenewal: sub.autoRenewal,
      price: sub.price,
      currency: sub.currency,
      userLimit: sub.userLimit,
      storageLimit: sub.storageLimit,
      activeModules: sub.activeModules,
    })
    setOpen(true)
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  // Plan distribution for pie chart
  const planDist = data.reduce((acc, s) => {
    acc[s.planType] = (acc[s.planType] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const planChart = Object.entries(planDist).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))

  const statCards = [
    { label: 'Total Subscriptions', value: stats.total, icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Expiring Soon', value: stats.expiringSoon, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Total Revenue', value: fmt(stats.revenue), icon: DollarSign, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                <div className={`p-1.5 rounded-md ${s.bg}`}><s.icon className={`h-3.5 w-3.5 ${s.color}`} /></div>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={planChart} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {planChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <RTooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Subscriptions</CardTitle>
                <CardDescription>Manage client subscriptions</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-9" onClick={() => { setEditId(null); setFormData(emptyForm); setOpen(true) }}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[440px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Plan</TableHead>
                    <TableHead className="text-xs">Client</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Start</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Expiry</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Auto Renew</TableHead>
                    <TableHead className="text-xs">Price</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted rounded w-16 animate-pulse" /></TableCell>
                      ))}</TableRow>
                    ))
                  ) : data.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No subscriptions found</TableCell></TableRow>
                  ) : (
                    data.map((sub) => (
                      <TableRow key={sub.id} className="hover:bg-accent/50">
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] capitalize">{sub.planType}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{sub.client?.companyName || '—'}</TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{fmtDate(sub.startDate)}</TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{fmtDate(sub.expiryDate)}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant={sub.autoRenewal ? 'default' : 'secondary'} className="text-[10px]">
                            {sub.autoRenewal ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium">{fmt(sub.price)}</TableCell>
                        <TableCell>
                          <Badge variant={sub.status === 'active' ? 'default' : sub.status === 'expired' ? 'destructive' : 'secondary'} className="text-[10px] capitalize">
                            {sub.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(sub)}><Pencil className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAction(sub.id, { planType: 'enterprise', price: 9999 })}>
                                <ArrowUpRight className="mr-2 h-3.5 w-3.5" /> Upgrade
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAction(sub.id, { planType: 'monthly', price: 299 })}>
                                <ArrowDownRight className="mr-2 h-3.5 w-3.5" /> Downgrade
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                const ext = new Date(sub.expiryDate)
                                ext.setMonth(ext.getMonth() + 1)
                                handleAction(sub.id, { expiryDate: ext.toISOString() })
                              }}><Clock className="mr-2 h-3.5 w-3.5" /> Extend</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAction(sub.id, { status: 'suspended' })}>
                                <Ban className="mr-2 h-3.5 w-3.5" /> Suspend
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(sub.id)}>
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
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Subscription' : 'Add Subscription'}</DialogTitle>
            <DialogDescription>{editId ? 'Modify subscription plan and billing details' : 'Create a new subscription for a client'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Client *</Label>
                <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Plan Type *</Label>
                <Select value={formData.planType} onValueChange={(v) => setFormData({ ...formData, planType: v })}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select plan" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="monthly">Monthly - $299</SelectItem>
                    <SelectItem value="annual">Annual - $2,999</SelectItem>
                    <SelectItem value="enterprise">Enterprise - $9,999</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Start Date</Label>
                <Input type="date" className="h-10 text-sm" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Expiry Date</Label>
                <Input type="date" className="h-10 text-sm" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Price ($)</Label>
                <Input type="number" className="h-10 text-sm" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">User Limit</Label>
                <Input type="number" className="h-10 text-sm" value={formData.userLimit} onChange={(e) => setFormData({ ...formData, userLimit: Number(e.target.value) })} placeholder="5" />
              </div>
              <div className="flex items-center gap-2 col-span-1 md:col-span-2">
                <Switch checked={formData.autoRenewal} onCheckedChange={(v) => setFormData({ ...formData, autoRenewal: v })} />
                <Label className="text-xs">Auto Renewal</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm">{editId ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
