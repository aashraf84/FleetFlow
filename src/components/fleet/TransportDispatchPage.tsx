'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, MapPin, Clock, Plus, Loader2, ClipboardList, Send, Truck, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800', dispatched: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-emerald-100 text-emerald-800', completed: 'bg-gray-100 text-gray-800', cancelled: 'bg-red-100 text-red-800',
}

export default function TransportDispatchPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [drivers, setDrivers] = useState<any[]>([])
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ordRes, driRes] = await Promise.all([
        fetch('/api/fleet/dispatch'),
        fetch('/api/fleet/drivers')
      ])
      if (ordRes.ok) { const j = await ordRes.json(); setOrders(j.data || []) }
      if (driRes.ok) { const j = await driRes.json(); setDrivers(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/fleet/dispatch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      if (res.ok) { toast.success('Dispatch order created'); fetchData(); setOpen(false); setForm({}) }
      else toast.error('Failed')
    } catch (e) { toast.error('Request failed') } finally { setSaving(false) }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/fleet/dispatch', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status })
      })
      if (res.ok) { toast.success('Status updated'); fetchData() }
    } catch (e) { toast.error('Failed') }
  }

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: ClipboardList, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-950/30' },
    { label: 'Pending', value: orders.filter(o => o.status === 'pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Dispatched', value: orders.filter(o => o.status === 'dispatched').length, icon: Send, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30' },
    { label: 'In Transit', value: orders.filter(o => o.status === 'in_transit').length, icon: Truck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Completed', value: orders.filter(o => o.status === 'completed').length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">Dispatch Center</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Vehicle and driver dispatch management</CardDescription>
          </div>
          <Button onClick={() => { setForm({ origin: '', destination: '', driverId: '', priority: 'normal', status: 'pending', scheduledDeparture: new Date().toISOString(), completedTime: '', instructions: '' }); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />New Dispatch</Button>
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
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[440px]">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Order #</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Driver</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Route</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Scheduled</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Priority</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
                orders.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No dispatch orders</TableCell></TableRow> :
                orders.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="text-xs font-mono">{o.orderNumber}</TableCell>
                    <TableCell className="text-xs hidden md:table-cell">{o.driver ? `${o.driver.firstName} ${o.driver.lastName}` : 'Unassigned'}</TableCell>
                    <TableCell className="text-xs hidden md:table-cell">{o.origin} → {o.destination}</TableCell>
                    <TableCell className="text-xs hidden lg:table-cell">{fmtDate(o.scheduledDeparture)}</TableCell>
                    <TableCell className="hidden lg:table-cell"><Badge variant={o.priority === 'urgent' ? 'destructive' : o.priority === 'high' ? 'default' : 'outline'} className="text-[10px] capitalize">{o.priority}</Badge></TableCell>
                    <TableCell><Badge className={`text-[10px] ${statusColors[o.status] || ''}`}>{o.status?.replace('_', ' ')}</Badge></TableCell>
                    <TableCell>
                      {o.status === 'pending' && <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateStatus(o.id, 'dispatched')}>Dispatch</Button>}
                      {o.status === 'dispatched' && <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateStatus(o.id, 'in_transit')}>Start Transit</Button>}
                      {o.status === 'in_transit' && <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateStatus(o.id, 'completed')}>Complete</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { if (!saving) setOpen(v) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Dispatch Order</DialogTitle>
            <DialogDescription>Create a new dispatch order for a vehicle and driver.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Assignment Section */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Assignment</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Driver <span className="text-destructive">*</span></Label><Select value={form.driverId || ''} onValueChange={v => setForm({...form, driverId: v})} required><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select driver" /></SelectTrigger><SelectContent>{drivers.filter(d => d.status === 'active').map(d => <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Priority <span className="text-destructive">*</span></Label><Select value={form.priority || 'normal'} onValueChange={v => setForm({...form, priority: v})} required><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select priority" /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div>
              </div>
            </div>
            {/* Route Section */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Route</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Origin <span className="text-destructive">*</span></Label><Input value={form.origin || ''} onChange={e => setForm({...form, origin: e.target.value})} className="h-10 mt-1" placeholder="e.g. Warehouse A" required /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Destination <span className="text-destructive">*</span></Label><Input value={form.destination || ''} onChange={e => setForm({...form, destination: e.target.value})} className="h-10 mt-1" placeholder="e.g. Client Site B" required /></div>
              </div>
            </div>
            {/* Schedule Section */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Schedule</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Scheduled Time</Label><Input type="datetime-local" value={form.scheduledDeparture ? form.scheduledDeparture.slice(0, 16) : ''} onChange={e => setForm({...form, scheduledDeparture: e.target.value})} className="h-10 mt-1" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Completed Time</Label><Input type="datetime-local" value={form.completedTime ? form.completedTime.slice(0, 16) : ''} onChange={e => setForm({...form, completedTime: e.target.value})} className="h-10 mt-1" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Status</Label><Select value={form.status || 'pending'} onValueChange={v => setForm({...form, status: v})}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="dispatched">Dispatched</SelectItem><SelectItem value="in_transit">In Transit</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select></div>
                <div className="col-span-1 md:col-span-3"><Label className="text-xs font-medium text-muted-foreground">Instructions</Label><Input value={form.instructions || ''} onChange={e => setForm({...form, instructions: e.target.value})} className="h-10 mt-1" placeholder="e.g. Deliver to loading dock B, call on arrival" /></div>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
