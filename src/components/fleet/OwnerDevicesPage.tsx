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
import {
  Monitor, CheckCircle, XCircle, Clock, Search, Plus, ShieldCheck, ShieldOff,
  Trash2, Power, MapPin, Globe, MoreHorizontal
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip, Legend } from 'recharts'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const COLORS = ['#10b981', '#ef4444', '#f59e0b']

interface Device {
  id: string
  deviceName: string
  browser: string | null
  os: string | null
  ipAddress: string | null
  lastLogin: string | null
  location: string | null
  status: string
  createdAt: string
}

interface Stats { total: number; approved: number; blocked: number; pending: number }

export default function OwnerDevicesPage() {
  const [data, setData] = useState<Device[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, approved: 0, blocked: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    deviceName: '', browser: '', os: '', ipAddress: '', location: '', status: 'pending',
  })
  const { addNotification } = useAppStore()

  useEffect(() => { fetchData() }, [search, statusFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/fleet/devices?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data || [])
        setStats(json.stats || { total: 0, approved: 0, blocked: 0, pending: 0 })
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/fleet/devices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast.success('Device registered')
        fetchData()
        setOpen(false)
        setFormData({ deviceName: '', browser: '', os: '', ipAddress: '', location: '', status: 'pending' })
      }
    } catch (e) { toast.error('Failed to register device') }
  }

  const handleAction = async (id: string, updates: Partial<Device>) => {
    try {
      const res = await fetch(`/api/fleet/devices`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      if (res.ok) {
        toast.success('Device updated')
        addNotification({ title: 'Device Updated', message: `Device status changed to ${updates.status}`, type: 'info' })
        fetchData()
      }
    } catch (e) { toast.error('Failed to update device') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this device?')) return
    try {
      const res = await fetch(`/api/fleet/devices?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Device removed'); fetchData() }
    } catch (e) { toast.error('Failed to remove device') }
  }

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  const statusDist = [
    { name: 'Approved', value: stats.approved },
    { name: 'Blocked', value: stats.blocked },
    { name: 'Pending', value: stats.pending },
  ].filter(d => d.value > 0)

  const statCards = [
    { label: 'Total Devices', value: stats.total, icon: Monitor, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Blocked', value: stats.blocked, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
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
            <CardTitle className="text-base">Device Status</CardTitle>
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

        {/* Device Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Device Registry</CardTitle>
                <CardDescription>Manage connected devices</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search devices..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-28 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-9" onClick={() => setOpen(true)}>
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
                    <TableHead className="text-xs">Device Name</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Browser</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">OS</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">IP Address</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Last Login</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Location</TableHead>
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
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No devices found</TableCell></TableRow>
                  ) : (
                    data.map((dev) => (
                      <TableRow key={dev.id} className="hover:bg-accent/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Monitor className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs font-medium">{dev.deviceName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{dev.browser || '—'}</TableCell>
                        <TableCell className="text-xs hidden lg:table-cell">{dev.os || '—'}</TableCell>
                        <TableCell className="text-xs hidden md:table-cell font-mono">{dev.ipAddress || '—'}</TableCell>
                        <TableCell className="text-xs hidden lg:table-cell">{fmtDate(dev.lastLogin)}</TableCell>
                        <TableCell className="text-xs hidden lg:table-cell">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {dev.location || '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={dev.status === 'approved' ? 'default' : dev.status === 'blocked' ? 'destructive' : 'outline'} className="text-[10px] capitalize">
                            {dev.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {dev.status === 'pending' && (
                                <DropdownMenuItem onClick={() => handleAction(dev.id, { status: 'approved' })}>
                                  <ShieldCheck className="mr-2 h-3.5 w-3.5" /> Approve
                                </DropdownMenuItem>
                              )}
                              {dev.status !== 'blocked' && (
                                <DropdownMenuItem onClick={() => handleAction(dev.id, { status: 'blocked' })}>
                                  <ShieldOff className="mr-2 h-3.5 w-3.5" /> Block
                                </DropdownMenuItem>
                              )}
                              {dev.status === 'blocked' && (
                                <DropdownMenuItem onClick={() => handleAction(dev.id, { status: 'approved' })}>
                                  <ShieldCheck className="mr-2 h-3.5 w-3.5" /> Unblock
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleAction(dev.id, { lastLogin: null })}>
                                <Power className="mr-2 h-3.5 w-3.5" /> Terminate Session
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(dev.id)}>
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove
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

      {/* Add Device Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Device</DialogTitle>
            <DialogDescription>Add a new device to the registry. Provide device details for tracking and management.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Device Name *</Label>
              <Input className="h-10 text-sm" value={formData.deviceName} onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })} required placeholder="e.g., Chrome on Windows 11" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Browser</Label>
                <Select value={formData.browser} onValueChange={(v) => setFormData({ ...formData, browser: v })}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select browser" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Chrome">Chrome</SelectItem>
                    <SelectItem value="Firefox">Firefox</SelectItem>
                    <SelectItem value="Safari">Safari</SelectItem>
                    <SelectItem value="Edge">Edge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">OS</Label>
                <Select value={formData.os} onValueChange={(v) => setFormData({ ...formData, os: v })}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select OS" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Windows 11">Windows 11</SelectItem>
                    <SelectItem value="macOS">macOS</SelectItem>
                    <SelectItem value="Linux">Linux</SelectItem>
                    <SelectItem value="iOS">iOS</SelectItem>
                    <SelectItem value="Android">Android</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">IP Address</Label>
                <Input className="h-10 text-sm" value={formData.ipAddress} onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })} placeholder="192.168.1.1" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Location</Label>
                <Input className="h-10 text-sm" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="City, Country" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm">Register Device</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
