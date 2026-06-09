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
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Route, Users, MapPin, Clock, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function TransportTripsPage() {
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [drivers, setDrivers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tripsRes, driRes, vehRes] = await Promise.all([
        fetch('/api/fleet/trips'),
        fetch('/api/fleet/drivers'),
        fetch('/api/fleet/vehicles')
      ])
      if (tripsRes.ok) { const j = await tripsRes.json(); setTrips(j.data || []) }
      if (driRes.ok) { const j = await driRes.json(); setDrivers(j.data || []) }
      if (vehRes.ok) { const j = await vehRes.json(); setVehicles(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (editMode && form.id) {
        const res = await fetch('/api/fleet/trips', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        })
        if (res.ok) { toast.success('Trip updated'); fetchData(); setOpen(false); setForm({}) }
        else toast.error('Failed to update trip')
      } else {
        const res = await fetch('/api/fleet/trips', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, status: 'planned' })
        })
        if (res.ok) { toast.success('Trip created'); fetchData(); setOpen(false); setForm({}) }
        else toast.error('Failed to create trip')
      }
    } catch (e) { toast.error('Request failed') } finally { setSaving(false) }
  }

  const handleEdit = (trip: any) => {
    setForm({
      id: trip.id,
      driverId: trip.driverId,
      vehicleId: trip.vehicleId || '',
      dispatchOrderId: trip.dispatchOrderId || '',
      origin: trip.origin,
      destination: trip.destination,
      startTime: trip.startTime ? new Date(trip.startTime).toISOString().slice(0, 16) : '',
      endTime: trip.endTime ? new Date(trip.endTime).toISOString().slice(0, 16) : '',
      distance: trip.distance || 0,
      status: trip.status || 'planned',
      notes: trip.notes || '',
    })
    setEditMode(true)
    setOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/fleet/trips?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Trip deleted'); fetchData() }
      else toast.error('Failed to delete trip')
    } catch (e) { toast.error('Delete failed') } finally { setDeleteOpen(false); setDeleteId(null) }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const updateData: any = { id, status }
      if (status === 'in_progress') updateData.startTime = new Date().toISOString()
      if (status === 'completed') updateData.endTime = new Date().toISOString()
      const res = await fetch('/api/fleet/trips', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      if (res.ok) {
        const statusLabels: Record<string, string> = { in_progress: 'started', completed: 'completed', cancelled: 'cancelled' }
        toast.success(`Trip ${statusLabels[status] || status}`)
        fetchData()
      } else toast.error('Failed to update status')
    } catch (e) { toast.error('Status update failed') }
  }

  const stats = [
    { label: 'Total Trips', value: trips.length },
    { label: 'Planned', value: trips.filter(t => t.status === 'planned').length },
    { label: 'In Progress', value: trips.filter(t => t.status === 'in_progress').length },
    { label: 'Completed', value: trips.filter(t => t.status === 'completed').length },
  ]

  const statusBadge = (status: string) => {
    const cls = status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
      status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
      status === 'cancelled' ? 'bg-red-100 text-red-800' :
      'bg-gray-100 text-gray-800'
    return <Badge className={`text-[10px] ${cls}`}>{status?.replace('_', ' ')}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Trip Management</h2><p className="text-sm text-muted-foreground">Track trip distances, ETAs, and performance</p></div>
        <Button onClick={() => {
          setForm({ driverId: '', vehicleId: '', dispatchOrderId: '', origin: '', destination: '', startTime: new Date().toISOString().slice(0, 16), endTime: '', distance: 0, status: 'planned', notes: '' })
          setEditMode(false)
          setOpen(true)
        }}><Plus className="h-4 w-4 mr-2" />New Trip</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Route</TableHead><TableHead className="text-xs">Driver</TableHead><TableHead className="text-xs">Vehicle</TableHead>
                <TableHead className="text-xs">Start Time</TableHead><TableHead className="text-xs">Distance</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs w-40">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
                trips.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No trips recorded</TableCell></TableRow> :
                trips.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1">
                        <Route className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{t.origin}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{t.destination}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{t.driver ? `${t.driver.firstName} ${t.driver.lastName}` : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{t.vehicle ? `${t.vehicle.make} ${t.vehicle.model}` : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{t.startTime ? new Date(t.startTime).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{t.distance?.toLocaleString()} km</TableCell>
                    <TableCell>{statusBadge(t.status)}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1 flex-wrap">
                        {t.status === 'planned' && (
                          <>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-blue-600" onClick={() => handleStatusChange(t.id, 'in_progress')}>Start</Button>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-red-600" onClick={() => handleStatusChange(t.id, 'cancelled')}>Cancel</Button>
                          </>
                        )}
                        {t.status === 'in_progress' && (
                          <>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-emerald-600" onClick={() => handleStatusChange(t.id, 'completed')}>Complete</Button>
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-red-600" onClick={() => handleStatusChange(t.id, 'cancelled')}>Cancel</Button>
                          </>
                        )}
                        {(t.status === 'planned') && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(t)}><Pencil className="h-3 w-3" /></Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setDeleteId(t.id); setDeleteOpen(true) }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create/Edit Trip Dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!saving) setOpen(v) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit Trip' : 'New Trip'}</DialogTitle>
            <DialogDescription>{editMode ? 'Update the trip details below.' : 'Fill in the details to create a new trip.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Assignment Section */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Assignment</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Driver <span className="text-destructive">*</span></Label><Select value={form.driverId || ''} onValueChange={v => setForm({...form, driverId: v})} required><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select driver" /></SelectTrigger><SelectContent>{drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Vehicle <span className="text-destructive">*</span></Label><Select value={form.vehicleId || ''} onValueChange={v => setForm({...form, vehicleId: v})} required><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger><SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.make} {v.model}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Dispatch Order</Label><Input value={form.dispatchOrderId || ''} onChange={e => setForm({...form, dispatchOrderId: e.target.value})} className="h-10 mt-1" placeholder="e.g. ORD-001" /></div>
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
                <div><Label className="text-xs font-medium text-muted-foreground">Start Time <span className="text-destructive">*</span></Label><Input type="datetime-local" value={form.startTime || ''} onChange={e => setForm({...form, startTime: e.target.value})} className="h-10 mt-1" required /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">End Time</Label><Input type="datetime-local" value={form.endTime || ''} onChange={e => setForm({...form, endTime: e.target.value})} className="h-10 mt-1" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Est. Distance (km)</Label><Input type="number" value={form.distance || ''} onChange={e => setForm({...form, distance: parseFloat(e.target.value) || 0})} className="h-10 mt-1" placeholder="0" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Status</Label><Select value={form.status || 'planned'} onValueChange={v => setForm({...form, status: v})}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="planned">Planned</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select></div>
                <div className="col-span-1 md:col-span-3"><Label className="text-xs font-medium text-muted-foreground">Notes</Label><Textarea value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} className="mt-1 min-h-[80px]" rows={2} placeholder="Trip notes..." /></div>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editMode ? 'Update Trip' : 'Create Trip'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Trip</DialogTitle><DialogDescription>This action cannot be undone.</DialogDescription></DialogHeader>
          <p className="text-sm text-muted-foreground py-4">Are you sure you want to delete this trip? This action cannot be undone.</p>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
