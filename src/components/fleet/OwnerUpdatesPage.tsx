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
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  RefreshCw, CheckCircle, AlertTriangle, Tag, Search, Plus, Pencil, Trash2,
  Rocket, AlertCircle, FileText, MoreHorizontal, Globe, Package
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip, Legend } from 'recharts'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444']

interface UpdateRecord {
  id: string
  version: string
  releaseNotes: string
  type: string
  isCritical: boolean
  forceUpdate: boolean
  status: string
  publishedAt: string | null
  createdAt: string
}

interface Stats {
  total: number
  published: number
  critical: number
  latestVersion: string
}

const emptyForm = {
  version: '', releaseNotes: '', type: 'minor', isCritical: false, forceUpdate: false, status: 'draft',
}

export default function OwnerUpdatesPage() {
  const [data, setData] = useState<UpdateRecord[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0, critical: 0, latestVersion: 'N/A' })
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
      const res = await fetch(`/api/fleet/updates?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data || [])
        setStats(json.stats || { total: 0, published: 0, critical: 0, latestVersion: 'N/A' })
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/fleet/updates`, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editId ? { id: editId, ...formData } : formData),
      })
      if (res.ok) {
        toast.success(editId ? 'Update modified' : 'Update published')
        addNotification({ title: editId ? 'Update Modified' : 'Update Published', message: `Version ${formData.version}`, type: 'success' })
        fetchData()
        setOpen(false)
        setEditId(null)
        setFormData(emptyForm)
      }
    } catch (e) { toast.error('Operation failed') }
  }

  const handleAction = async (id: string, updates: Partial<UpdateRecord>) => {
    try {
      const res = await fetch(`/api/fleet/updates`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      if (res.ok) {
        toast.success('Update modified')
        fetchData()
      }
    } catch (e) { toast.error('Failed to update') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this update record?')) return
    try {
      const res = await fetch(`/api/fleet/updates?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Deleted'); fetchData() }
    } catch (e) { toast.error('Failed to delete') }
  }

  const openEdit = (u: UpdateRecord) => {
    setEditId(u.id)
    setFormData({
      version: u.version,
      releaseNotes: u.releaseNotes,
      type: u.type,
      isCritical: u.isCritical,
      forceUpdate: u.forceUpdate,
      status: u.status,
    })
    setOpen(true)
  }

  const publishUpdate = (u: UpdateRecord) => {
    handleAction(u.id, { status: 'published', publishedAt: new Date().toISOString() })
    addNotification({ title: 'Update Published', message: `Version ${u.version} is now live`, type: 'success' })
  }

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  // Type distribution for chart
  const typeDist = data.reduce((acc, u) => {
    acc[u.type] = (acc[u.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const typeChart = Object.entries(typeDist).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))

  const statCards = [
    { label: 'Total Updates', value: stats.total, icon: RefreshCw, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Published', value: stats.published, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Critical', value: stats.critical, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
    { label: 'Latest Version', value: stats.latestVersion, icon: Tag, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
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
        {/* Type Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Update Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeChart} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {typeChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <RTooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <Separator className="my-3" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium">Version Distribution</p>
                  <p className="text-[10px] text-muted-foreground">
                    {data.filter(u => u.status === 'published').length} published versions across all tenants
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Updates Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Update Management</CardTitle>
                <CardDescription>Publish and manage platform updates</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-28 h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" className="h-9" onClick={() => { setEditId(null); setFormData(emptyForm); setOpen(true) }}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> New
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Version</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Release Notes</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Critical</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Force</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Published</TableHead>
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
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No updates found</TableCell></TableRow>
                  ) : (
                    data.map((u) => (
                      <TableRow key={u.id} className="hover:bg-accent/50">
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <code className="text-xs font-mono font-bold">{u.version}</code>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-48 truncate text-xs">{u.releaseNotes}</TableCell>
                        <TableCell>
                          <Badge variant={u.type === 'critical' ? 'destructive' : u.type === 'major' ? 'default' : 'outline'} className="text-[10px] capitalize">
                            {u.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {u.isCritical ? <AlertCircle className="h-4 w-4 text-red-500" /> : <span className="text-xs text-muted-foreground">No</span>}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {u.forceUpdate ? <Badge variant="destructive" className="text-[10px]">Force</Badge> : <span className="text-xs text-muted-foreground">No</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.status === 'published' ? 'default' : u.status === 'deprecated' ? 'secondary' : 'outline'} className="text-[10px] capitalize">
                            {u.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs hidden md:table-cell">{fmtDate(u.publishedAt)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(u)}><Pencil className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                              {u.status === 'draft' && (
                                <DropdownMenuItem onClick={() => publishUpdate(u)}>
                                  <Rocket className="mr-2 h-3.5 w-3.5" /> Publish
                                </DropdownMenuItem>
                              )}
                              {u.status === 'published' && (
                                <DropdownMenuItem onClick={() => handleAction(u.id, { status: 'deprecated' })}>
                                  <FileText className="mr-2 h-3.5 w-3.5" /> Deprecate
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(u.id)}>
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

      {/* Publish Update Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Update' : 'Publish New Update'}</DialogTitle>
            <DialogDescription>{editId ? 'Modify update version, release notes, and settings' : 'Create a new platform update version with release notes'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Version *</Label>
                <Input className="h-10 text-sm font-mono" value={formData.version} onChange={(e) => setFormData({ ...formData, version: e.target.value })} required placeholder="e.g., 2.3.0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Type *</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="patch">Patch</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Release Notes *</Label>
              <Textarea className="min-h-[80px] text-sm" value={formData.releaseNotes} onChange={(e) => setFormData({ ...formData, releaseNotes: e.target.value })} required placeholder="Describe what's new in this version..." />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={formData.isCritical} onCheckedChange={(v) => setFormData({ ...formData, isCritical: v })} />
                <Label className="text-xs">Critical Update</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.forceUpdate} onCheckedChange={(v) => setFormData({ ...formData, forceUpdate: v })} />
                <Label className="text-xs">Force Update</Label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger className="h-10 text-sm"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.isCritical && (
              <div className="p-3 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-medium">Critical update will trigger immediate notifications to all tenants</span>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm">{editId ? 'Save Changes' : 'Create Update'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
