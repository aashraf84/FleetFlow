'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Car, CalendarDays, Wrench, Plus, Loader2, AlertCircle, Clock, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, string> = { scheduled: 'bg-amber-100 text-amber-800', in_progress: 'bg-blue-100 text-blue-800', completed: 'bg-emerald-100 text-emerald-800', cancelled: 'bg-red-100 text-red-800' }

export default function MaintenanceCorrectivePage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [mRes, vRes] = await Promise.all([fetch('/api/fleet/maintenance?type=corrective'), fetch('/api/fleet/vehicles')])
      if (mRes.ok) { const j = await mRes.json(); setRecords(j.data || []) }
      if (vRes.ok) { const j = await vRes.json(); setVehicles(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/fleet/maintenance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, type: 'corrective' }) })
      if (res.ok) { toast.success('Repair request created'); fetchData(); setOpen(false); setForm({}) }
      else toast.error('Failed')
    } catch (e) { toast.error('Request failed') } finally { setSaving(false) }
  }

  const updateStatus = async (id: string, status: string) => {
    try { const res = await fetch('/api/fleet/maintenance', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }); if (res.ok) { toast.success('Updated'); fetchData() } } catch (e) { toast.error('Failed') }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`
  const stats = [
    { label: 'Total Repairs', value: records.length, icon: Wrench, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-950/30' },
    { label: 'Open', value: records.filter(r => r.status === 'scheduled').length, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'In Progress', value: records.filter(r => r.status === 'in_progress').length, icon: Clock, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30' },
    { label: 'Total Cost', value: fmt(records.reduce((s, r) => s + (r.cost || 0), 0)), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">Corrective Maintenance</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Manage repair requests, work orders, and costs</CardDescription>
          </div>
          <Button onClick={() => { setForm({ category: 'repair', type: 'corrective', status: 'scheduled', cost: 0, priority: 'normal', scheduledDate: '', completedDate: '', odometer: '', notes: '' }); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />New Repair Request</Button>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
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
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[440px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Vehicle</TableHead>
            <TableHead className="text-xs hidden md:table-cell">Category</TableHead>
            <TableHead className="text-xs hidden md:table-cell">Description</TableHead>
            <TableHead className="text-xs hidden lg:table-cell">Vendor</TableHead>
            <TableHead className="text-xs hidden lg:table-cell">Cost</TableHead>
            <TableHead className="text-xs">Status</TableHead>
            <TableHead className="text-xs">Actions</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
            records.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No corrective maintenance records</TableCell></TableRow> :
            records.map(r => (
              <TableRow key={r.id}>
                <TableCell className="text-xs font-medium">{r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : 'N/A'}</TableCell>
                <TableCell className="text-xs capitalize hidden md:table-cell">{r.category?.replace('_', ' ')}</TableCell>
                <TableCell className="text-xs max-w-48 truncate hidden md:table-cell">{r.description}</TableCell>
                <TableCell className="text-xs hidden lg:table-cell">{r.vendor || 'N/A'}</TableCell>
                <TableCell className="text-xs font-medium hidden lg:table-cell">{fmt(r.cost)}</TableCell>
                <TableCell><Badge className={`text-[10px] ${statusColors[r.status] || ''}`}>{r.status?.replace('_', ' ')}</Badge></TableCell>
                <TableCell>
                  {r.status === 'scheduled' && <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateStatus(r.id, 'in_progress')}>Start</Button>}
                  {r.status === 'in_progress' && <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateStatus(r.id, 'completed')}>Complete</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={(v) => { if (!saving) setOpen(v) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Repair Request</DialogTitle>
            <DialogDescription>Create a new corrective maintenance repair request for a vehicle.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Vehicle & Type Section */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Car className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Vehicle & Type</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Vehicle <span className="text-destructive">*</span></Label><Select value={form.vehicleId || ''} onValueChange={v => setForm({...form, vehicleId: v})} required><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger><SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.make} {v.model}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Type</Label><Input value="Corrective" disabled className="h-10 mt-1 bg-muted" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Category <span className="text-destructive">*</span></Label><Select value={form.category || 'repair'} onValueChange={v => setForm({...form, category: v})} required><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent><SelectItem value="repair">Repair</SelectItem><SelectItem value="body_work">Body Work</SelectItem><SelectItem value="electrical">Electrical</SelectItem><SelectItem value="ac">AC</SelectItem><SelectItem value="engine">Engine</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
              </div>
            </div>
            {/* Schedule Section */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Schedule</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Scheduled Date <span className="text-destructive">*</span></Label><Input type="date" value={form.scheduledDate || ''} onChange={e => setForm({...form, scheduledDate: e.target.value})} className="h-10 mt-1" required /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Completed Date</Label><Input type="date" value={form.completedDate || ''} onChange={e => setForm({...form, completedDate: e.target.value})} className="h-10 mt-1" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Priority</Label><Select value={form.priority || 'normal'} onValueChange={v => setForm({...form, priority: v})}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select priority" /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Status</Label><Select value={form.status || 'scheduled'} onValueChange={v => setForm({...form, status: v})}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select></div>
              </div>
            </div>
            {/* Details Section */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Wrench className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-3"><Label className="text-xs font-medium text-muted-foreground">Description <span className="text-destructive">*</span></Label><Input value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="h-10 mt-1" placeholder="e.g. Engine overheating, brake noise" required /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Vendor</Label><Input value={form.vendor || ''} onChange={e => setForm({...form, vendor: e.target.value})} className="h-10 mt-1" placeholder="e.g. ABC Auto Repair" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Estimated Cost ($)</Label><Input type="number" value={form.cost || ''} onChange={e => setForm({...form, cost: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="0.00" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Odometer (km)</Label><Input type="number" value={form.odometer || ''} onChange={e => setForm({...form, odometer: parseFloat(e.target.value) || 0})} className="h-10 mt-1" placeholder="e.g. 75000" /></div>
                <div className="col-span-1 md:col-span-3"><Label className="text-xs font-medium text-muted-foreground">Notes</Label><Input value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} className="h-10 mt-1" placeholder="Additional notes" /></div>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
