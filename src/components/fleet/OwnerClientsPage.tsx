'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Building2, Users, UserX, UserPlus, Search, Plus, Pencil, Trash2, Ban, CheckCircle2,
  Phone, Mail, Globe, MoreHorizontal, Eye, Loader2, CreditCard
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Client {
  id: string
  companyName: string
  contactPerson: string
  email: string
  phone: string | null
  country: string | null
  industryType: string | null
  subscriptionPlan: string
  licenseStatus: string
  status: string
  notes: string | null
  createdAt: string
  subscription?: { planType: string; status: string; price: number } | null
  license?: { licenseKey: string; status: string } | null
  activities?: { action: string; details: string | null; createdAt: string }[]
}

interface Stats {
  total: number
  active: number
  suspended: number
  newThisMonth: number
}

const emptyForm = {
  companyName: '', contactPerson: '', email: '', phone: '', country: '',
  industryType: '', subscriptionPlan: 'trial', licenseStatus: 'active', notes: '',
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
  const { addNotification } = useAppStore()

  useEffect(() => { fetchData() }, [search, statusFilter])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editId
        ? `/api/fleet/clients`
        : `/api/fleet/clients`
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editId ? { id: editId, ...formData } : formData),
      })
      if (res.ok) {
        toast.success(editId ? 'Client updated successfully' : 'Client created successfully')
        addNotification({ title: editId ? 'Client Updated' : 'Client Created', message: `${formData.companyName} has been ${editId ? 'updated' : 'added'}`, type: 'success' })
        fetchData()
        setOpen(false)
        setEditId(null)
        setFormData(emptyForm)
      }
    } catch (e) {
      toast.error('Operation failed')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return
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
    })
    setOpen(true)
  }

  const openCreate = () => {
    setEditId(null)
    setFormData(emptyForm)
    setOpen(true)
  }

  const statCards = [
    { label: 'Total Clients', value: stats.total, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Active', value: stats.active, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Suspended', value: stats.suspended, icon: UserX, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
    { label: 'New This Month', value: stats.newThisMonth, icon: UserPlus, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
  ]

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
              <CardDescription>Manage all enterprise clients</CardDescription>
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

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!saving) setOpen(v) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Client' : 'Add New Client'}</DialogTitle>
            <DialogDescription>{editId ? 'Update client information and settings' : 'Enter details to register a new enterprise client'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-2">
            {/* Company Information */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Building2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Company Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Company Name *</Label>
                  <Input className="h-10 text-sm mt-1" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} required placeholder="Enter company name" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Country</Label>
                  <Input className="h-10 text-sm mt-1" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="United States" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Industry</Label>
                  <Select value={formData.industryType} onValueChange={(v) => setFormData({ ...formData, industryType: v })}>
                    <SelectTrigger className="h-10 text-sm mt-1"><SelectValue placeholder="Select industry" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Logistics">Logistics</SelectItem>
                      <SelectItem value="Transport">Transport</SelectItem>
                      <SelectItem value="Car Rental">Car Rental</SelectItem>
                      <SelectItem value="Fleet Management">Fleet Management</SelectItem>
                      <SelectItem value="Government">Government</SelectItem>
                      <SelectItem value="Construction">Construction</SelectItem>
                      <SelectItem value="Oil & Gas">Oil & Gas</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select></div>
              </div>
            </div>
            {/* Contact Details */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Phone className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Contact Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Contact Person *</Label>
                  <Input className="h-10 text-sm mt-1" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} required placeholder="Full name of contact person" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Email *</Label>
                  <Input type="email" className="h-10 text-sm mt-1" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required placeholder="contact@company.com" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Phone</Label>
                  <Input className="h-10 text-sm mt-1" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 (555) 000-0000" /></div>
              </div>
            </div>
            {/* Subscription & License */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <CreditCard className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Subscription & License</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Subscription Plan</Label>
                  <Select value={formData.subscriptionPlan} onValueChange={(v) => setFormData({ ...formData, subscriptionPlan: v })}>
                    <SelectTrigger className="h-10 text-sm mt-1"><SelectValue placeholder="Select plan" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select></div>
                <div><Label className="text-xs font-medium text-muted-foreground">License Status</Label>
                  <Select value={formData.licenseStatus} onValueChange={(v) => setFormData({ ...formData, licenseStatus: v })}>
                    <SelectTrigger className="h-10 text-sm mt-1"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select></div>
              </div>
            </div>
            {/* Additional Information */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Mail className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Additional Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-3"><Label className="text-xs font-medium text-muted-foreground">Notes</Label>
                  <Textarea className="min-h-[80px] text-sm mt-1" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes about this client..." /></div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={saving}>{saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}{editId ? 'Update' : 'Create'}</Button>
            </DialogFooter>
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
