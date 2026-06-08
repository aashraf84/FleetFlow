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
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  TrendingUp, DollarSign, Calendar, AlertCircle, Search, Plus, Pencil, Trash2,
  ArrowUpRight, ArrowDownRight, BarChart3, CreditCard, MoreHorizontal
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { AreaChart, Area, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6']

interface RevenueRecord {
  id: string
  category: string
  amount: number
  currency: string
  clientId: string | null
  description: string | null
  date: string
  client: { companyName: string } | null
}

interface Stats {
  totalRevenue: number
  monthlyRevenue: number
  annualRevenue: number
  pendingPayments: number
  totalRecords: number
}

const emptyForm = {
  category: 'sales', amount: 0, description: '', date: new Date().toISOString().split('T')[0], clientId: '',
}

export default function OwnerRevenuePage() {
  const [data, setData] = useState<RevenueRecord[]>([])
  const [clients, setClients] = useState<{ id: string; companyName: string }[]>([])
  const [stats, setStats] = useState<Stats>({ totalRevenue: 0, monthlyRevenue: 0, annualRevenue: 0, pendingPayments: 0, totalRecords: 0 })
  const [revenueTrend, setRevenueTrend] = useState<{ month: string; amount: number }[]>([])
  const [categoryChart, setCategoryChart] = useState<{ name: string; value: number }[]>([])
  const [subMetrics, setSubMetrics] = useState({ newSubsGrowthPct: 0, renewalRate: 0, avgRevPerClient: 0, churnRate: 0, retentionRate: 0, revenueGrowthPct: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const { addNotification } = useAppStore()

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

  useEffect(() => { fetchData() }, [search, categoryFilter, fromDate, toDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (categoryFilter) params.set('category', categoryFilter)
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)
      const res = await fetch(`/api/fleet/revenue?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data || [])
        setStats(json.stats || { totalRevenue: 0, monthlyRevenue: 0, annualRevenue: 0, pendingPayments: 0, totalRecords: 0 })
        setRevenueTrend(json.revenueTrend || [])
        setCategoryChart(json.categoryChart || [])
        setSubMetrics(json.subscriptionMetrics || { newSubsGrowthPct: 0, renewalRate: 0, avgRevPerClient: 0, churnRate: 0, retentionRate: 0, revenueGrowthPct: 0 })
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const body = { ...formData, date: new Date(formData.date).toISOString() }
      if (!formData.clientId) delete (body as any).clientId
      const res = await fetch(`/api/fleet/revenue`, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editId ? { id: editId, ...body } : body),
      })
      if (res.ok) {
        toast.success(editId ? 'Revenue record updated' : 'Revenue record created')
        addNotification({ title: 'Revenue Updated', message: `Revenue record ${editId ? 'updated' : 'added'}`, type: 'success' })
        fetchData()
        setOpen(false)
        setEditId(null)
        setFormData(emptyForm)
      }
    } catch (e) { toast.error('Operation failed') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this revenue record?')) return
    try {
      const res = await fetch(`/api/fleet/revenue?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Deleted'); fetchData() }
    } catch (e) { toast.error('Failed to delete') }
  }

  const openEdit = (r: RevenueRecord) => {
    setEditId(r.id)
    setFormData({
      category: r.category,
      amount: r.amount,
      description: r.description || '',
      date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
      clientId: r.clientId || '',
    })
    setOpen(true)
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const statCards = [
    { label: 'Total Revenue', value: fmt(stats.totalRevenue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', trend: `${subMetrics.revenueGrowthPct >= 0 ? '+' : ''}${subMetrics.revenueGrowthPct}%`, up: subMetrics.revenueGrowthPct >= 0 },
    { label: 'Monthly Revenue', value: fmt(stats.monthlyRevenue), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', trend: `${subMetrics.revenueGrowthPct >= 0 ? '+' : ''}${subMetrics.revenueGrowthPct}%`, up: subMetrics.revenueGrowthPct >= 0 },
    { label: 'Annual Revenue', value: fmt(stats.annualRevenue), icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', trend: subMetrics.avgRevPerClient > 0 ? `$${(subMetrics.avgRevPerClient / 1000).toFixed(1)}k/client` : '—', up: true },
    { label: 'Pending Payments', value: fmt(stats.pendingPayments), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', trend: stats.totalRevenue > 0 ? `${Math.round(stats.pendingPayments / stats.totalRevenue * 100)}% of rev` : '—', up: false },
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
              <p className="text-xl font-bold">{s.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {s.up ? <ArrowUpRight className="h-3 w-3 text-emerald-500" /> : <ArrowDownRight className="h-3 w-3 text-red-500" />}
                <span className={`text-[10px] ${s.up ? 'text-emerald-500' : 'text-red-500'}`}>{s.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <RTooltip formatter={(value: number) => [fmt(value), 'Revenue']} />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue by Category</CardTitle>
            <CardDescription>Distribution of revenue sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryChart} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {categoryChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <RTooltip formatter={(value: number) => fmt(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Revenue Records</CardTitle>
              <CardDescription>Track all revenue transactions</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-28 h-9 text-sm"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="renewal">Renewal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" className="w-32 h-9 text-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <Input type="date" className="w-32 h-9 text-sm" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              <Button size="sm" className="h-9" onClick={() => { setEditId(null); setFormData(emptyForm); setOpen(true) }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[420px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Client</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-muted rounded w-16 animate-pulse" /></TableCell>
                    ))}</TableRow>
                  ))
                ) : data.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
                ) : (
                  data.map((r) => (
                    <TableRow key={r.id} className="hover:bg-accent/50">
                      <TableCell className="text-xs">{fmtDate(r.date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">{r.category}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{r.client?.companyName || '—'}</TableCell>
                      <TableCell className="text-xs max-w-48 truncate">{r.description || '—'}</TableCell>
                      <TableCell className="text-xs font-bold text-emerald-600">{fmt(r.amount)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(r)}><Pencil className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(r.id)}>
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

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Subscription Growth</CardTitle>
            <CardDescription>Monthly subscription metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg border">
                <p className="text-2xl font-bold text-emerald-600">+{subMetrics.newSubsGrowthPct}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">New Subscriptions</p>
              </div>
              <div className="text-center p-3 rounded-lg border">
                <p className="text-2xl font-bold text-blue-600">{subMetrics.renewalRate}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">Renewal Rate</p>
              </div>
              <div className="text-center p-3 rounded-lg border">
                <p className="text-2xl font-bold text-violet-600">${(subMetrics.avgRevPerClient / 1000).toFixed(1)}k</p>
                <p className="text-[10px] text-muted-foreground mt-1">Avg. Rev/Client</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Churn Analysis</CardTitle>
            <CardDescription>Customer retention metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg border">
                <p className="text-2xl font-bold text-red-600">{subMetrics.churnRate}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">Churn Rate</p>
              </div>
              <div className="text-center p-3 rounded-lg border">
                <p className="text-2xl font-bold text-amber-600">{subMetrics.renewalRate}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">Auto-Renewal</p>
              </div>
              <div className="text-center p-3 rounded-lg border">
                <p className="text-2xl font-bold text-emerald-600">{subMetrics.retentionRate}%</p>
                <p className="text-[10px] text-muted-foreground mt-1">Retention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Revenue Record' : 'Add Revenue Record'}</DialogTitle>
            <DialogDescription>{editId ? 'Update revenue transaction details' : 'Record a new revenue transaction'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="renewal">Renewal</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Amount ($) *</Label>
                <Input type="number" step="0.01" className="h-10 text-sm" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} required placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" className="h-10 text-sm" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Client</Label>
                <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1 md:col-span-2 space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea className="min-h-[80px] text-sm" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Describe this revenue transaction..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm">{editId ? 'Update' : 'Add Record'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
