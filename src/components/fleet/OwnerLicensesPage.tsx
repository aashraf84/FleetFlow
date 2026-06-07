'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Key, CheckCircle, XCircle, Clock, Search, Plus, Copy, ShieldCheck, ShieldOff,
  ShieldAlert, MoreHorizontal, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip, Legend } from 'recharts'

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6366f1']

interface License {
  id: string
  clientId: string
  licenseKey: string
  activationDate: string | null
  expiryDate: string | null
  status: string
  maxDevices: number
  client: { companyName: string; contactPerson: string } | null
}

interface Stats { total: number; active: number; expired: number; trial: number }

export default function OwnerLicensesPage() {
  const [data, setData] = useState<License[]>([])
  const [clients, setClients] = useState<{ id: string; companyName: string }[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, expired: 0, trial: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({ clientId: '', maxDevices: 3, status: 'trial' })
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
      const res = await fetch(`/api/fleet/licenses?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data || [])
        setStats(json.stats || { total: 0, active: 0, expired: 0, trial: 0 })
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/fleet/licenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast.success('License generated successfully')
        addNotification({ title: 'License Generated', message: 'New license key has been generated', type: 'success' })
        fetchData()
        setOpen(false)
        setFormData({ clientId: '', maxDevices: 3, status: 'trial' })
      }
    } catch (e) { toast.error('Failed to generate license') }
  }

  const handleAction = async (id: string, updates: Partial<License>) => {
    try {
      const res = await fetch(`/api/fleet/licenses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      if (res.ok) {
        toast.success('License updated')
        addNotification({ title: 'License Updated', message: `License status changed`, type: 'info' })
        fetchData()
      }
    } catch (e) { toast.error('Failed to update license') }
  }

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('License key copied to clipboard')
  }

  const validateKey = (key: string) => {
    const isValid = key.startsWith('FF-') && key.length === 15
    toast[isValid ? 'success' : 'error'](isValid ? 'Valid license key format' : 'Invalid license key format')
  }

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  // Status distribution
  const statusDist = [
    { name: 'Active', value: stats.active },
    { name: 'Expired', value: stats.expired },
    { name: 'Trial', value: stats.trial },
  ].filter(d => d.value > 0)

  const statCards = [
    { label: 'Total Licenses', value: stats.total, icon: Key, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Active', value: stats.active, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Expired', value: stats.expired, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
    { label: 'Trial', value: stats.trial, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
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
        {/* Status Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">License Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <RTooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* License Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">License Keys</CardTitle>
                <CardDescription>Generate and manage license keys</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search keys..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-28 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-9" onClick={() => setOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Generate
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[440px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">License Key</TableHead>
                    <TableHead className="text-xs">Client</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Activated</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Expiry</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Max Devices</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><div className="h-4 bg-muted rounded w-16 animate-pulse" /></TableCell>
                      ))}</TableRow>
                    ))
                  ) : data.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No licenses found</TableCell></TableRow>
                  ) : (
                    data.map((lic) => (
                      <TableRow key={lic.id} className="hover:bg-accent/50">
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{lic.licenseKey}</code>
                            <TooltipProvider><Tooltip><TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyKey(lic.licenseKey)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger><TooltipContent>Copy key</TooltipContent></Tooltip></TooltipProvider>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{lic.client?.companyName || '—'}</TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{fmtDate(lic.activationDate)}</TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{fmtDate(lic.expiryDate)}</TableCell>
                        <TableCell className="text-xs hidden lg:table-cell">{lic.maxDevices}</TableCell>
                        <TableCell>
                          <Badge variant={lic.status === 'active' ? 'default' : lic.status === 'expired' ? 'destructive' : 'outline'} className="text-[10px] capitalize">
                            {lic.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => validateKey(lic.licenseKey)}>
                                <ShieldCheck className="mr-2 h-3.5 w-3.5" /> Validate
                              </DropdownMenuItem>
                              {lic.status !== 'active' && (
                                <DropdownMenuItem onClick={() => handleAction(lic.id, { status: 'active', activationDate: new Date().toISOString(), expiryDate: new Date(Date.now() + 365 * 86400000).toISOString() })}>
                                  <ShieldCheck className="mr-2 h-3.5 w-3.5" /> Activate
                                </DropdownMenuItem>
                              )}
                              {lic.status === 'active' && (
                                <DropdownMenuItem onClick={() => handleAction(lic.id, { status: 'suspended' })}>
                                  <ShieldOff className="mr-2 h-3.5 w-3.5" /> Deactivate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleAction(lic.id, { expiryDate: new Date(Date.now() + 365 * 86400000).toISOString(), status: 'active' })}>
                                <RefreshCw className="mr-2 h-3.5 w-3.5" /> Renew
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

      {/* Generate Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate New License</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Client *</Label>
              <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })} required>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.companyName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Max Devices</Label>
                <Input type="number" className="h-9 text-sm" value={formData.maxDevices} onChange={(e) => setFormData({ ...formData, maxDevices: Number(e.target.value) })} min={1} max={100} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Initial Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="p-3 rounded-md bg-muted text-xs text-muted-foreground">
              License key will be auto-generated in format: FF-XXXX-XXXX-XXXX
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm">Generate License</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
