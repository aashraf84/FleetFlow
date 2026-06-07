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
import { Progress } from '@/components/ui/progress'
import {
  Server, Users, HardDrive, Puzzle, Search, Plus, Pencil, Trash2, CheckCircle,
  Ban, Globe, MoreHorizontal, Cpu
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Tenant {
  id: string
  name: string
  domain: string | null
  status: string
  activeUsers: number
  storageUsed: number
  storageLimit: number
  userLimit: number
  modulesEnabled: string
  createdAt: string
}

interface Stats {
  total: number
  activeUsers: number
  totalStorage: number
  activeModules: number
}

const emptyForm = {
  name: '', domain: '', status: 'active', activeUsers: 0, storageLimit: 1024,
  userLimit: 10, modulesEnabled: 'fleet,rental,customer,driver',
}

export default function OwnerTenantsPage() {
  const [data, setData] = useState<Tenant[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, activeUsers: 0, totalStorage: 0, activeModules: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState(emptyForm)
  const { addNotification } = useAppStore()

  useEffect(() => { fetchData() }, [search, statusFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/fleet/tenants?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data || [])
        setStats(json.stats || { total: 0, activeUsers: 0, totalStorage: 0, activeModules: 0 })
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/fleet/tenants`, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editId ? { id: editId, ...formData } : formData),
      })
      if (res.ok) {
        toast.success(editId ? 'Tenant updated' : 'Tenant created')
        addNotification({ title: editId ? 'Tenant Updated' : 'Tenant Created', message: `${formData.name} has been ${editId ? 'updated' : 'created'}`, type: 'success' })
        fetchData()
        setOpen(false)
        setEditId(null)
        setFormData(emptyForm)
      }
    } catch (e) { toast.error('Operation failed') }
  }

  const handleAction = async (id: string, updates: Partial<Tenant>) => {
    try {
      const res = await fetch(`/api/fleet/tenants`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      if (res.ok) {
        toast.success('Tenant updated')
        fetchData()
      }
    } catch (e) { toast.error('Failed to update tenant') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this tenant? All associated data will be affected.')) return
    try {
      const res = await fetch(`/api/fleet/tenants?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Tenant deleted')
        addNotification({ title: 'Tenant Deleted', message: 'Tenant has been removed', type: 'warning' })
        fetchData()
      }
    } catch (e) { toast.error('Failed to delete tenant') }
  }

  const openEdit = (tenant: Tenant) => {
    setEditId(tenant.id)
    setFormData({
      name: tenant.name,
      domain: tenant.domain || '',
      status: tenant.status,
      activeUsers: tenant.activeUsers,
      storageLimit: tenant.storageLimit,
      userLimit: tenant.userLimit,
      modulesEnabled: tenant.modulesEnabled,
    })
    setOpen(true)
  }

  const fmtStorage = (mb: number) => mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`

  const statCards = [
    { label: 'Total Tenants', value: stats.total, icon: Server, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Active Users', value: stats.activeUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Total Storage', value: fmtStorage(stats.totalStorage), icon: HardDrive, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
    { label: 'Active Modules', value: stats.activeModules, icon: Puzzle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
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

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Tenant Management</CardTitle>
              <CardDescription>Manage platform tenants</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search tenants..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-28 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" className="h-9" onClick={() => { setEditId(null); setFormData(emptyForm); setOpen(true) }}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Create
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[520px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Domain</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Users</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Storage</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Modules</TableHead>
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
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No tenants found</TableCell></TableRow>
                ) : (
                  data.map((tenant) => {
                    const storagePct = tenant.storageLimit > 0 ? Math.round((tenant.storageUsed / tenant.storageLimit) * 100) : 0
                    const modules = tenant.modulesEnabled.split(',').length
                    return (
                      <TableRow key={tenant.id} className="hover:bg-accent/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 text-primary shrink-0">
                              <Server className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{tenant.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{tenant.domain || 'No domain'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs hidden md:table-cell">
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            {tenant.domain || '—'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={tenant.status === 'active' ? 'default' : tenant.status === 'suspended' ? 'destructive' : 'secondary'} className="text-[10px] capitalize">
                            {tenant.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {tenant.activeUsers}/{tenant.userLimit}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="w-24">
                            <div className="flex items-center justify-between text-[10px] mb-0.5">
                              <span>{fmtStorage(tenant.storageUsed)}</span>
                              <span className="text-muted-foreground">{storagePct}%</span>
                            </div>
                            <Progress value={storagePct} className="h-1.5" />
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1">
                            <Cpu className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{modules} modules</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(tenant)}><Pencil className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                              {tenant.status === 'suspended' && (
                                <DropdownMenuItem onClick={() => handleAction(tenant.id, { status: 'active' })}>
                                  <CheckCircle className="mr-2 h-3.5 w-3.5" /> Activate
                                </DropdownMenuItem>
                              )}
                              {tenant.status === 'active' && (
                                <DropdownMenuItem onClick={() => handleAction(tenant.id, { status: 'suspended' })}>
                                  <Ban className="mr-2 h-3.5 w-3.5" /> Suspend
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(tenant.id)}>
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Tenant' : 'Create Tenant'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name *</Label>
                <Input className="h-9 text-sm" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Domain</Label>
                <Input className="h-9 text-sm" value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} placeholder="tenant.fleetflow.os" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">User Limit</Label>
                <Input type="number" className="h-9 text-sm" value={formData.userLimit} onChange={(e) => setFormData({ ...formData, userLimit: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Storage Limit (MB)</Label>
                <Input type="number" className="h-9 text-sm" value={formData.storageLimit} onChange={(e) => setFormData({ ...formData, storageLimit: Number(e.target.value) })} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Modules</Label>
                <Input className="h-9 text-sm" value={formData.modulesEnabled} onChange={(e) => setFormData({ ...formData, modulesEnabled: e.target.value })} placeholder="fleet,rental,customer,driver" />
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
