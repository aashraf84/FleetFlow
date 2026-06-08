'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, Search, Edit, Trash2, Eye, Play, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-blue-100 text-blue-800',
  terminated: 'bg-red-100 text-red-800',
  breached: 'bg-orange-100 text-orange-800',
}

export default function RentalContractsPage() {
  const [contracts, setContracts] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [detailItem, setDetailItem] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [editForm, setEditForm] = useState<any>({})

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [rentRes, cusRes, vehRes, resRes] = await Promise.all([
        fetch('/api/fleet/rentals'),
        fetch('/api/fleet/customers'),
        fetch('/api/fleet/vehicles'),
        fetch('/api/fleet/reservations'),
      ])
      if (rentRes.ok) { const j = await rentRes.json(); setContracts(j.data || []) }
      if (cusRes.ok) { const j = await cusRes.json(); setCustomers(j.data || []) }
      if (vehRes.ok) { const j = await vehRes.json(); setVehicles(j.data || []) }
      if (resRes.ok) { const j = await resRes.json(); setReservations(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'

  const calcTotals = (f: any) => {
    const start = f.startDate ? new Date(f.startDate) : null
    const end = f.endDate ? new Date(f.endDate) : null
    if (start && end) {
      const diff = end.getTime() - start.getTime()
      const days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
      const amount = days * (f.dailyRate || 0)
      return { totalDays: days, totalAmount: amount }
    }
    return { totalDays: f.totalDays || 0, totalAmount: f.totalAmount || 0 }
  }

  const openCreate = () => {
    setForm({
      customerId: '', vehicleId: '', reservationId: '', startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      dailyRate: 0, totalDays: 0, totalAmount: 0, depositAmount: 0, mileageLimit: '',
      terms: '', notes: '', status: 'draft',
    })
    setCreateOpen(true)
  }

  const openEdit = (item: any) => {
    setEditItem(item)
    setEditForm({
      id: item.id,
      customerId: item.customerId,
      vehicleId: item.vehicleId,
      startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
      endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
      dailyRate: item.dailyRate,
      totalDays: item.totalDays,
      totalAmount: item.totalAmount,
      depositAmount: item.depositAmount,
      mileageLimit: item.mileageLimit || '',
      terms: item.terms || '',
      notes: item.notes || '',
    })
    setEditOpen(true)
  }

  const openDetail = (item: any) => {
    setDetailItem(item)
    setDetailOpen(true)
  }

  const handleCreate = async () => {
    if (!form.customerId || !form.vehicleId) {
      toast.error('Customer and Vehicle are required')
      return
    }
    try {
      const totals = calcTotals(form)
      const payload = {
        ...form,
        totalDays: totals.totalDays,
        totalAmount: totals.totalAmount,
        mileageLimit: form.mileageLimit ? parseFloat(form.mileageLimit) : null,
      }
      const res = await fetch('/api/fleet/rentals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (res.ok) { toast.success('Contract created'); fetchData(); setCreateOpen(false); setForm({}) }
      else { const j = await res.json(); toast.error(j.error || 'Failed') }
    } catch (e) { toast.error('Request failed') }
  }

  const handleEdit = async () => {
    try {
      const totals = calcTotals(editForm)
      const payload = {
        id: editForm.id,
        customerId: editForm.customerId,
        vehicleId: editForm.vehicleId,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        dailyRate: editForm.dailyRate,
        totalDays: totals.totalDays,
        totalAmount: totals.totalAmount,
        depositAmount: editForm.depositAmount,
        mileageLimit: editForm.mileageLimit ? parseFloat(editForm.mileageLimit) : null,
        terms: editForm.terms,
        notes: editForm.notes,
      }
      const res = await fetch('/api/fleet/rentals', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      })
      if (res.ok) { toast.success('Contract updated'); fetchData(); setEditOpen(false); setEditItem(null) }
      else { const j = await res.json(); toast.error(j.error || 'Failed') }
    } catch (e) { toast.error('Request failed') }
  }

  const handleStatusChange = async (id: string, statusChange: string) => {
    try {
      const res = await fetch('/api/fleet/rentals', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, statusChange })
      })
      if (res.ok) { toast.success(`Contract ${statusChange}`); fetchData() }
      else { const j = await res.json(); toast.error(j.error || 'Failed') }
    } catch (e) { toast.error('Request failed') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this draft contract?')) return
    try {
      const res = await fetch(`/api/fleet/rentals?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Contract deleted'); fetchData() }
      else { const j = await res.json(); toast.error(j.error || 'Failed') }
    } catch (e) { toast.error('Request failed') }
  }

  const filtered = contracts.filter(c => {
    if (!search) return true
    const customer = c.customer ? `${c.customer.firstName} ${c.customer.lastName}` : ''
    const vehicle = c.vehicle ? `${c.vehicle.make} ${c.vehicle.model}` : ''
    return customer.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.toLowerCase().includes(search.toLowerCase()) ||
      c.contractNumber?.toLowerCase().includes(search.toLowerCase()) ||
      c.status?.toLowerCase().includes(search.toLowerCase())
  })

  const stats = [
    { label: 'Total Contracts', value: contracts.length },
    { label: 'Draft', value: contracts.filter(c => c.status === 'draft').length },
    { label: 'Active', value: contracts.filter(c => c.status === 'active').length },
    { label: 'Completed', value: contracts.filter(c => c.status === 'completed').length },
    { label: 'Terminated', value: contracts.filter(c => c.status === 'terminated').length },
    { label: 'Total Value', value: fmt(contracts.reduce((s, c) => s + (c.totalAmount || 0), 0)) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rental Contracts</h2>
          <p className="text-sm text-muted-foreground">View and manage rental contracts</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />New Contract
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search contracts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Contract #</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Vehicle</TableHead>
                  <TableHead className="text-xs">Period</TableHead>
                  <TableHead className="text-xs">Daily Rate</TableHead>
                  <TableHead className="text-xs">Total</TableHead>
                  <TableHead className="text-xs">Deposit</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No contracts found</TableCell></TableRow>
                ) : filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs font-mono">{c.contractNumber}</TableCell>
                    <TableCell className="text-xs">{c.customer ? `${c.customer.firstName} ${c.customer.lastName}` : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{c.vehicle ? `${c.vehicle.make} ${c.vehicle.model}` : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{fmtDate(c.startDate)} - {fmtDate(c.endDate)}</TableCell>
                    <TableCell className="text-xs">{fmt(c.dailyRate)}</TableCell>
                    <TableCell className="text-xs font-medium">{fmt(c.totalAmount)}</TableCell>
                    <TableCell className="text-xs">{fmt(c.depositAmount)}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${statusColors[c.status] || ''}`}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="View Details" onClick={() => openDetail(c)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {c.status === 'draft' && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => openEdit(c)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" title="Activate" onClick={() => handleStatusChange(c.id, 'active')}>
                              <Play className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Delete" onClick={() => handleDelete(c.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {c.status === 'active' && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" title="Complete" onClick={() => handleStatusChange(c.id, 'completed')}>
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" title="Terminate" onClick={() => handleStatusChange(c.id, 'terminated')}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create Contract Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Rental Contract</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label className="text-xs">Customer *</Label>
              <Select value={form.customerId || ''} onValueChange={v => setForm({ ...form, customerId: v })}>
                <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Vehicle *</Label>
              <Select value={form.vehicleId || ''} onValueChange={v => {
                const veh = vehicles.find(x => x.id === v)
                setForm({ ...form, vehicleId: v, dailyRate: veh?.dailyRate || form.dailyRate })
              }}>
                <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.filter(v => v.status === 'available' || v.status === 'rented').map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.make} {v.model} ({v.registrationNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Reservation (Optional)</Label>
              <Select value={form.reservationId || '_none'} onValueChange={v => {
                if (v === '_none') {
                  setForm({ ...form, reservationId: '' })
                } else {
                  const res = reservations.find(r => r.id === v)
                  setForm({
                    ...form,
                    reservationId: v,
                    customerId: res?.customerId || form.customerId,
                    vehicleId: res?.vehicleId || form.vehicleId,
                    startDate: res?.startDate ? new Date(res.startDate).toISOString().split('T')[0] : form.startDate,
                    endDate: res?.endDate ? new Date(res.endDate).toISOString().split('T')[0] : form.endDate,
                  })
                }
              }}>
                <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Select reservation (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {reservations.filter(r => r.status === 'confirmed' || r.status === 'active').map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.reservationCode} - {r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : 'Unknown'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Start Date</Label>
              <Input type="date" value={form.startDate || ''} onChange={e => {
                const updated = { ...form, startDate: e.target.value }
                const totals = calcTotals(updated)
                setForm({ ...updated, totalDays: totals.totalDays, totalAmount: totals.totalAmount })
              }} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">End Date</Label>
              <Input type="date" value={form.endDate || ''} onChange={e => {
                const updated = { ...form, endDate: e.target.value }
                const totals = calcTotals(updated)
                setForm({ ...updated, totalDays: totals.totalDays, totalAmount: totals.totalAmount })
              }} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Daily Rate ($)</Label>
              <Input type="number" value={form.dailyRate || ''} onChange={e => {
                const updated = { ...form, dailyRate: parseFloat(e.target.value) || 0 }
                const totals = calcTotals(updated)
                setForm({ ...updated, totalDays: totals.totalDays, totalAmount: totals.totalAmount })
              }} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Total Days (auto)</Label>
              <Input type="number" value={calcTotals(form).totalDays} disabled className="h-9 mt-1 bg-muted" />
            </div>
            <div>
              <Label className="text-xs">Total Amount ($) (auto)</Label>
              <Input type="number" value={calcTotals(form).totalAmount} disabled className="h-9 mt-1 bg-muted" />
            </div>
            <div>
              <Label className="text-xs">Deposit Amount ($)</Label>
              <Input type="number" value={form.depositAmount || ''} onChange={e => setForm({ ...form, depositAmount: parseFloat(e.target.value) || 0 })} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Mileage Limit (km)</Label>
              <Input type="number" value={form.mileageLimit || ''} onChange={e => setForm({ ...form, mileageLimit: e.target.value })} className="h-9 mt-1" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Terms & Conditions</Label>
              <Textarea value={form.terms || ''} onChange={e => setForm({ ...form, terms: e.target.value })} className="mt-1" rows={3} placeholder="Enter contract terms..." />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1" rows={2} placeholder="Additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Contract</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contract Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label className="text-xs">Customer</Label>
              <Select value={editForm.customerId || ''} onValueChange={v => setEditForm({ ...editForm, customerId: v })}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Vehicle</Label>
              <Select value={editForm.vehicleId || ''} onValueChange={v => {
                const veh = vehicles.find(x => x.id === v)
                setEditForm({ ...editForm, vehicleId: v, dailyRate: veh?.dailyRate || editForm.dailyRate })
              }}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.make} {v.model} ({v.registrationNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Start Date</Label>
              <Input type="date" value={editForm.startDate || ''} onChange={e => {
                const updated = { ...editForm, startDate: e.target.value }
                const totals = calcTotals(updated)
                setEditForm({ ...updated, totalDays: totals.totalDays, totalAmount: totals.totalAmount })
              }} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">End Date</Label>
              <Input type="date" value={editForm.endDate || ''} onChange={e => {
                const updated = { ...editForm, endDate: e.target.value }
                const totals = calcTotals(updated)
                setEditForm({ ...updated, totalDays: totals.totalDays, totalAmount: totals.totalAmount })
              }} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Daily Rate ($)</Label>
              <Input type="number" value={editForm.dailyRate || ''} onChange={e => {
                const updated = { ...editForm, dailyRate: parseFloat(e.target.value) || 0 }
                const totals = calcTotals(updated)
                setEditForm({ ...updated, totalDays: totals.totalDays, totalAmount: totals.totalAmount })
              }} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Total Days (auto)</Label>
              <Input type="number" value={calcTotals(editForm).totalDays} disabled className="h-9 mt-1 bg-muted" />
            </div>
            <div>
              <Label className="text-xs">Total Amount ($) (auto)</Label>
              <Input type="number" value={calcTotals(editForm).totalAmount} disabled className="h-9 mt-1 bg-muted" />
            </div>
            <div>
              <Label className="text-xs">Deposit Amount ($)</Label>
              <Input type="number" value={editForm.depositAmount || ''} onChange={e => setEditForm({ ...editForm, depositAmount: parseFloat(e.target.value) || 0 })} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Mileage Limit (km)</Label>
              <Input type="number" value={editForm.mileageLimit || ''} onChange={e => setEditForm({ ...editForm, mileageLimit: e.target.value })} className="h-9 mt-1" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Terms & Conditions</Label>
              <Textarea value={editForm.terms || ''} onChange={e => setEditForm({ ...editForm, terms: e.target.value })} className="mt-1" rows={3} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Notes</Label>
              <Textarea value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className="mt-1" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Update Contract</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contract Details — {detailItem?.contractNumber}</DialogTitle>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-6 py-4">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <Badge className={`${statusColors[detailItem.status] || ''} text-sm px-3 py-1`}>
                  {detailItem.status?.toUpperCase()}
                </Badge>
                {detailItem.reservation && (
                  <span className="text-xs text-muted-foreground">
                    From Reservation: {detailItem.reservation.reservationCode}
                  </span>
                )}
              </div>

              {/* Customer & Vehicle Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Customer</h4>
                  {detailItem.customer ? (
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Name:</span> {detailItem.customer.firstName} {detailItem.customer.lastName}</p>
                      <p><span className="font-medium">Email:</span> {detailItem.customer.email}</p>
                      <p><span className="font-medium">Phone:</span> {detailItem.customer.phone || 'N/A'}</p>
                      <p><span className="font-medium">License:</span> {detailItem.customer.drivingLicense || 'N/A'}</p>
                    </div>
                  ) : <p className="text-sm text-muted-foreground">N/A</p>}
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Vehicle</h4>
                  {detailItem.vehicle ? (
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Vehicle:</span> {detailItem.vehicle.make} {detailItem.vehicle.model} ({detailItem.vehicle.year})</p>
                      <p><span className="font-medium">Registration:</span> {detailItem.vehicle.registrationNumber}</p>
                      <p><span className="font-medium">Category:</span> {detailItem.vehicle.category}</p>
                      <p><span className="font-medium">Color:</span> {detailItem.vehicle.color || 'N/A'}</p>
                    </div>
                  ) : <p className="text-sm text-muted-foreground">N/A</p>}
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Rental Period</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Start:</span> {fmtDate(detailItem.startDate)}</p>
                    <p><span className="font-medium">End:</span> {fmtDate(detailItem.endDate)}</p>
                    <p><span className="font-medium">Duration:</span> {detailItem.totalDays} days</p>
                    {detailItem.signedDate && <p><span className="font-medium">Signed:</span> {fmtDate(detailItem.signedDate)}</p>}
                    {detailItem.returnDate && <p><span className="font-medium">Returned:</span> {fmtDate(detailItem.returnDate)}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Financials</h4>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Daily Rate:</span> {fmt(detailItem.dailyRate)}</p>
                    <p><span className="font-medium">Total Amount:</span> <span className="font-bold">{fmt(detailItem.totalAmount)}</span></p>
                    <p><span className="font-medium">Deposit:</span> {fmt(detailItem.depositAmount)}</p>
                    {detailItem.mileageLimit && <p><span className="font-medium">Mileage Limit:</span> {Number(detailItem.mileageLimit).toLocaleString()} km</p>}
                  </div>
                </div>
              </div>

              {/* Mileage */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">Mileage</h4>
                <div className="text-sm flex gap-6">
                  <p><span className="font-medium">Out:</span> {detailItem.mileageOut?.toLocaleString() || 0} km</p>
                  <p><span className="font-medium">In:</span> {detailItem.mileageIn?.toLocaleString() || 0} km</p>
                  {(detailItem.mileageIn > 0 && detailItem.mileageOut > 0) && (
                    <p><span className="font-medium">Used:</span> {(detailItem.mileageIn - detailItem.mileageOut).toLocaleString()} km</p>
                  )}
                </div>
              </div>

              {/* Terms & Notes */}
              {detailItem.terms && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Terms & Conditions</h4>
                  <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{detailItem.terms}</p>
                </div>
              )}
              {detailItem.notes && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Notes</h4>
                  <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">{detailItem.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t">
                {detailItem.status === 'draft' && (
                  <Button onClick={() => { handleStatusChange(detailItem.id, 'active'); setDetailOpen(false) }}>
                    <Play className="h-4 w-4 mr-2" />Activate Contract
                  </Button>
                )}
                {detailItem.status === 'active' && (
                  <>
                    <Button onClick={() => { handleStatusChange(detailItem.id, 'completed'); setDetailOpen(false) }}>
                      <CheckCircle className="h-4 w-4 mr-2" />Complete
                    </Button>
                    <Button variant="destructive" onClick={() => { handleStatusChange(detailItem.id, 'terminated'); setDetailOpen(false) }}>
                      <XCircle className="h-4 w-4 mr-2" />Terminate
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
