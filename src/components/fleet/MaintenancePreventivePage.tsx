'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Wrench, Plus } from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, string> = { scheduled: 'bg-amber-100 text-amber-800', in_progress: 'bg-blue-100 text-blue-800', completed: 'bg-emerald-100 text-emerald-800', cancelled: 'bg-red-100 text-red-800' }

export default function MaintenancePreventivePage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [form, setForm] = useState<any>({})

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [mRes, vRes] = await Promise.all([fetch('/api/fleet/maintenance?type=preventive'), fetch('/api/fleet/vehicles')])
      if (mRes.ok) { const j = await mRes.json(); setRecords(j.data || []) }
      if (vRes.ok) { const j = await vRes.json(); setVehicles(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/fleet/maintenance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, type: 'preventive' }) })
      if (res.ok) { toast.success('Maintenance scheduled'); fetchData(); setOpen(false); setForm({}) }
      else toast.error('Failed')
    } catch (e) { toast.error('Request failed') }
  }

  const updateStatus = async (id: string, status: string) => {
    try { const res = await fetch('/api/fleet/maintenance', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }); if (res.ok) { toast.success('Updated'); fetchData() } } catch (e) { toast.error('Failed') }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`
  const stats = [
    { label: 'Total Scheduled', value: records.length },
    { label: 'Pending', value: records.filter(r => r.status === 'scheduled').length },
    { label: 'In Progress', value: records.filter(r => r.status === 'in_progress').length },
    { label: 'Total Cost', value: fmt(records.reduce((s, r) => s + (r.cost || 0), 0)) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Preventive Maintenance</h2><p className="text-sm text-muted-foreground">Schedule oil changes, tire replacements, inspections, and services</p></div>
        <Button onClick={() => { setForm({ category: 'oil_change', status: 'scheduled', cost: 0 }); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />Schedule Maintenance</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{stats.map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}</div>
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Vehicle</TableHead><TableHead className="text-xs">Category</TableHead><TableHead className="text-xs">Description</TableHead>
            <TableHead className="text-xs">Scheduled</TableHead><TableHead className="text-xs">Next Due</TableHead><TableHead className="text-xs">Cost</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow> :
            records.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No preventive maintenance scheduled</TableCell></TableRow> :
            records.map(r => (
              <TableRow key={r.id}>
                <TableCell className="text-xs font-medium">{r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : 'N/A'}</TableCell>
                <TableCell className="text-xs capitalize">{r.category?.replace('_', ' ')}</TableCell>
                <TableCell className="text-xs max-w-48 truncate">{r.description}</TableCell>
                <TableCell className="text-xs">{r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell className="text-xs">{r.nextDueDate ? new Date(r.nextDueDate).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell className="text-xs font-medium">{fmt(r.cost)}</TableCell>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule Preventive Maintenance</DialogTitle>
            <DialogDescription>Schedule a new preventive maintenance task for a vehicle.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div><Label className="text-xs">Vehicle <span className="text-destructive">*</span></Label><Select value={form.vehicleId || ''} onValueChange={v => setForm({...form, vehicleId: v})} required><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger><SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.make} {v.model}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Category <span className="text-destructive">*</span></Label><Select value={form.category || 'oil_change'} onValueChange={v => setForm({...form, category: v})} required><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent><SelectItem value="oil_change">Oil Change</SelectItem><SelectItem value="tire_replacement">Tire Replacement</SelectItem><SelectItem value="inspection">Inspection</SelectItem><SelectItem value="service">Service</SelectItem><SelectItem value="brake">Brake Service</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
            <div className="col-span-1 md:col-span-2"><Label className="text-xs">Description <span className="text-destructive">*</span></Label><Input value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="h-10 mt-1" placeholder="e.g. 50000km service, oil and filter change" required /></div>
            <div><Label className="text-xs">Scheduled Date <span className="text-destructive">*</span></Label><Input type="date" value={form.scheduledDate || ''} onChange={e => setForm({...form, scheduledDate: e.target.value})} className="h-10 mt-1" required /></div>
            <div><Label className="text-xs">Estimated Cost ($)</Label><Input type="number" value={form.cost || ''} onChange={e => setForm({...form, cost: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="0.00" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Schedule</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
