'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Radio, Plus, Loader2 } from 'lucide-react'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Dispatch Center</h2><p className="text-sm text-muted-foreground">Vehicle and driver dispatch management</p></div>
        <Button onClick={() => { setForm({ origin: '', destination: '', status: 'pending', priority: 'normal', scheduledDeparture: new Date().toISOString() }); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />New Dispatch</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Orders', value: orders.length },
          { label: 'Pending', value: orders.filter(o => o.status === 'pending').length },
          { label: 'Dispatched', value: orders.filter(o => o.status === 'dispatched').length },
          { label: 'In Transit', value: orders.filter(o => o.status === 'in_transit').length },
          { label: 'Completed', value: orders.filter(o => o.status === 'completed').length },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Order #</TableHead><TableHead className="text-xs">Driver</TableHead><TableHead className="text-xs">Route</TableHead>
                <TableHead className="text-xs">Scheduled</TableHead><TableHead className="text-xs">Priority</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
                orders.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No dispatch orders</TableCell></TableRow> :
                orders.map(o => (
                  <TableRow key={o.id}>
                    <TableCell className="text-xs font-mono">{o.orderNumber}</TableCell>
                    <TableCell className="text-xs">{o.driver ? `${o.driver.firstName} ${o.driver.lastName}` : 'Unassigned'}</TableCell>
                    <TableCell className="text-xs">{o.origin} → {o.destination}</TableCell>
                    <TableCell className="text-xs">{fmtDate(o.scheduledDeparture)}</TableCell>
                    <TableCell><Badge variant={o.priority === 'urgent' ? 'destructive' : o.priority === 'high' ? 'default' : 'outline'} className="text-[10px] capitalize">{o.priority}</Badge></TableCell>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div><Label className="text-xs">Origin <span className="text-destructive">*</span></Label><Input value={form.origin || ''} onChange={e => setForm({...form, origin: e.target.value})} className="h-10 mt-1" placeholder="e.g. Warehouse A" required /></div>
            <div><Label className="text-xs">Destination <span className="text-destructive">*</span></Label><Input value={form.destination || ''} onChange={e => setForm({...form, destination: e.target.value})} className="h-10 mt-1" placeholder="e.g. Client Site B" required /></div>
            <div><Label className="text-xs">Driver <span className="text-destructive">*</span></Label><Select value={form.driverId || ''} onValueChange={v => setForm({...form, driverId: v})} required><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select driver" /></SelectTrigger><SelectContent>{drivers.filter(d => d.status === 'active').map(d => <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Priority <span className="text-destructive">*</span></Label><Select value={form.priority || 'normal'} onValueChange={v => setForm({...form, priority: v})} required><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select priority" /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Route Name</Label><Input value={form.routeName || ''} onChange={e => setForm({...form, routeName: e.target.value})} className="h-10 mt-1" placeholder="e.g. Route 42 - North" /></div>
            <div><Label className="text-xs">Scheduled Departure</Label><Input type="datetime-local" value={form.scheduledDeparture ? form.scheduledDeparture.slice(0, 16) : ''} onChange={e => setForm({...form, scheduledDeparture: e.target.value})} className="h-10 mt-1" /></div>
            <div className="col-span-1 md:col-span-2"><Label className="text-xs">Notes</Label><Input value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} className="h-10 mt-1" placeholder="Additional dispatch notes..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
