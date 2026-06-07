'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CalendarDays, Plus, Search } from 'lucide-react'
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

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/fleet/reservations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      if (res.ok) { toast.success('Reservation created'); fetchData(); setOpen(false); setForm({}) }
      else toast.error('Failed')
    } catch (e) { toast.error('Request failed') }
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
        <Button onClick={() => { setForm({ startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], status: 'pending', dailyRate: 0, totalAmount: 0, depositAmount: 0 }); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />New Reservation</Button>
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
                      {r.status === 'pending' && <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateStatus(r.id, 'confirmed')}>Confirm</Button>}
                      {r.status === 'confirmed' && <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateStatus(r.id, 'active')}>Activate</Button>}
                      {r.status === 'active' && <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateStatus(r.id, 'completed')}>Complete</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Reservation</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label className="text-xs">Customer</Label><Select value={form.customerId || ''} onValueChange={v => setForm({...form, customerId: v})}><SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Vehicle</Label><Select value={form.vehicleId || ''} onValueChange={v => { const veh = vehicles.find(x => x.id === v); setForm({...form, vehicleId: v, dailyRate: veh?.dailyRate || 0}) }}><SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger><SelectContent>{vehicles.filter(v => v.status === 'available').map(v => <SelectItem key={v.id} value={v.id}>{v.make} {v.model} (${v.dailyRate}/day)</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Start Date</Label><Input type="date" value={form.startDate || ''} onChange={e => setForm({...form, startDate: e.target.value})} className="h-9 mt-1" /></div>
              <div><Label className="text-xs">End Date</Label><Input type="date" value={form.endDate || ''} onChange={e => setForm({...form, endDate: e.target.value})} className="h-9 mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Daily Rate ($)</Label><Input type="number" value={form.dailyRate || ''} onChange={e => setForm({...form, dailyRate: parseFloat(e.target.value)})} className="h-9 mt-1" /></div>
              <div><Label className="text-xs">Total Amount ($)</Label><Input type="number" value={form.totalAmount || ''} onChange={e => setForm({...form, totalAmount: parseFloat(e.target.value)})} className="h-9 mt-1" /></div>
            </div>
            <div><Label className="text-xs">Deposit Amount ($)</Label><Input type="number" value={form.depositAmount || ''} onChange={e => setForm({...form, depositAmount: parseFloat(e.target.value)})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Pickup Location</Label><Input value={form.pickupLocation || ''} onChange={e => setForm({...form, pickupLocation: e.target.value})} className="h-9 mt-1" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
