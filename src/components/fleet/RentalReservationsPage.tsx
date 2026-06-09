'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CalendarDays, Plus, Search, Pencil, Trash2, Loader2, Users, DollarSign, MapPin } from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800', confirmed: 'bg-blue-100 text-blue-800', active: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-gray-100 text-gray-800', cancelled: 'bg-red-100 text-red-800', no_show: 'bg-purple-100 text-purple-800',
}

export default function RentalReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [form, setForm] = useState<any>({})

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resRes, cusRes, vehRes] = await Promise.all([
        fetch('/api/fleet/reservations'),
        fetch('/api/fleet/customers'),
        fetch('/api/fleet/vehicles')
      ])
      if (resRes.ok) { const j = await resRes.json(); setReservations(j.data || []) }
      if (cusRes.ok) { const j = await cusRes.json(); setCustomers(j.data || []) }
      if (vehRes.ok) { const j = await vehRes.json(); setVehicles(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const openEdit = (r: any) => {
    setEditId(r.id)
    setForm({
      customerId: r.customerId,
      vehicleId: r.vehicleId,
      startDate: r.startDate ? new Date(r.startDate).toISOString().split('T')[0] : '',
      endDate: r.endDate ? new Date(r.endDate).toISOString().split('T')[0] : '',
      dailyRate: r.dailyRate || 0,
      totalAmount: r.totalAmount || 0,
      depositAmount: r.depositAmount || 0,
      pickupLocation: r.pickupLocation || '',
      returnLocation: r.returnLocation || '',
      notes: r.notes || '',
      status: r.status,
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      // Sanitize form data — remove fields that should not be sent
      const { id, createdAt, updatedAt, customer, vehicle, reservationCode, tenantId, ...sanitized } = form as any
      if (editId) {
        const res = await fetch('/api/fleet/reservations', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...sanitized })
        })
        if (res.ok) { toast.success('Reservation updated'); fetchData(); setOpen(false); setEditId(null); setForm({}) }
        else toast.error('Failed to update')
      } else {
        const res = await fetch('/api/fleet/reservations', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sanitized)
        })
        if (res.ok) { toast.success('Reservation created'); fetchData(); setOpen(false); setForm({}) }
        else toast.error('Failed')
      }
    } catch (e) { toast.error('Request failed') } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/fleet/reservations?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Reservation cancelled'); fetchData(); setDeleteId(null) }
      else toast.error('Failed to cancel')
    } catch (e) { toast.error('Delete failed') } finally { setDeleting(false) }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/fleet/reservations', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status })
      })
      if (res.ok) { toast.success(`Status updated to ${status}`); fetchData() }
    } catch (e) { toast.error('Update failed') }
  }

  const filtered = reservations.filter(r => {
    if (!search) return true
    const c = r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : ''
    const v = r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : ''
    return c.toLowerCase().includes(search.toLowerCase()) || v.toLowerCase().includes(search.toLowerCase()) || r.reservationCode?.toLowerCase().includes(search.toLowerCase())
  })

  const fmt = (n: number) => `$${n?.toLocaleString()}`
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Reservations</h2><p className="text-sm text-muted-foreground">Manage rental reservations and bookings</p></div>
        <Button onClick={() => { setEditId(null); setForm({ startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], status: 'pending', dailyRate: 0, totalAmount: 0, depositAmount: 0 }); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />New Reservation</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Total', value: reservations.length },
          { label: 'Pending', value: reservations.filter(r => r.status === 'pending').length },
          { label: 'Confirmed', value: reservations.filter(r => r.status === 'confirmed').length },
          { label: 'Active', value: reservations.filter(r => r.status === 'active').length },
          { label: 'Completed', value: reservations.filter(r => r.status === 'completed').length },
          { label: 'Cancelled', value: reservations.filter(r => r.status === 'cancelled').length },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search reservations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" /></div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Code</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs">Vehicle</TableHead>
                <TableHead className="text-xs">Start</TableHead>
                <TableHead className="text-xs">End</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow> :
                filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No reservations found</TableCell></TableRow> :
                filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs font-mono">{r.reservationCode}</TableCell>
                    <TableCell className="text-xs">{r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{fmtDate(r.startDate)}</TableCell>
                    <TableCell className="text-xs">{fmtDate(r.endDate)}</TableCell>
                    <TableCell className="text-xs font-medium">{fmt(r.totalAmount)}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${statusColors[r.status] || ''}`}>{r.status?.replace('_', ' ')}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 flex-wrap">
                        {r.status === 'pending' && <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateStatus(r.id, 'confirmed')}>Confirm</Button>}
                        {r.status === 'confirmed' && <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateStatus(r.id, 'active')}>Activate</Button>}
                        {r.status === 'active' && <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateStatus(r.id, 'completed')}>Complete</Button>}
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openEdit(r)} title="Edit"><Pencil className="h-3 w-3" /></Button>
                        {(r.status === 'pending' || r.status === 'confirmed') && <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => setDeleteId(r.id)} title="Cancel Reservation"><Trash2 className="h-3 w-3" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={v => { if (!saving) { setOpen(v); if (!v) setEditId(null) } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? 'Edit Reservation' : 'New Reservation'}</DialogTitle><DialogDescription>{editId ? 'Update reservation details including dates, amounts, and locations.' : 'Create a new rental reservation by selecting customer, vehicle, and rental dates.'}</DialogDescription></DialogHeader>
          <div className="space-y-6 py-2">
            {/* Assignment Section */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Assignment</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Customer *</Label><Select value={form.customerId || ''} onValueChange={v => setForm({...form, customerId: v})}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Vehicle *</Label><Select value={form.vehicleId || ''} onValueChange={v => { const veh = vehicles.find(x => x.id === v); setForm({...form, vehicleId: v, dailyRate: veh?.dailyRate || 0}) }}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger><SelectContent>{vehicles.filter(v => v.status === 'available' || v.id === form.vehicleId).map(v => <SelectItem key={v.id} value={v.id}>{v.make} {v.model} (${v.dailyRate}/day)</SelectItem>)}</SelectContent></Select></div>
              </div>
            </div>

            {/* Schedule Section */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Schedule</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Start Date *</Label><Input type="date" value={form.startDate || ''} onChange={e => setForm({...form, startDate: e.target.value})} className="h-10 mt-1" required /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">End Date *</Label><Input type="date" value={form.endDate || ''} onChange={e => setForm({...form, endDate: e.target.value})} className="h-10 mt-1" required /></div>
              </div>
            </div>

            {/* Financial Section */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <DollarSign className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Financial</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Daily Rate ($)</Label><Input type="number" value={form.dailyRate || ''} onChange={e => setForm({...form, dailyRate: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="0.00" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Total Amount ($)</Label><Input type="number" value={form.totalAmount || ''} onChange={e => setForm({...form, totalAmount: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="0.00" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Deposit Amount ($)</Label><Input type="number" value={form.depositAmount || ''} onChange={e => setForm({...form, depositAmount: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="0.00" /></div>
              </div>
            </div>

            {/* Locations & Notes Section */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Locations & Notes</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Pickup Location</Label><Input value={form.pickupLocation || ''} onChange={e => setForm({...form, pickupLocation: e.target.value})} className="h-10 mt-1" placeholder="e.g. Main Office" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Return Location</Label><Input value={form.returnLocation || ''} onChange={e => setForm({...form, returnLocation: e.target.value})} className="h-10 mt-1" placeholder="e.g. Airport Branch" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Notes</Label><Input value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} className="h-10 mt-1" placeholder="Any special instructions" /></div>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => { setOpen(false); setEditId(null) }} disabled={saving}>Cancel</Button><Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editId ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Cancel Reservation</DialogTitle><DialogDescription>Are you sure you want to cancel this reservation? This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Keep</Button><Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Cancel Reservation</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
