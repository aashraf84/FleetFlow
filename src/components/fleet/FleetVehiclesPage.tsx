'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Car, Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  reserved: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  rented: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  maintenance: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  in_service: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  retired: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

export default function FleetVehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [viewItem, setViewItem] = useState<any>(null)
  const [form, setForm] = useState<any>({})

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/fleet/vehicles?${params}`)
      if (res.ok) { const json = await res.json(); setVehicles(json.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [search, statusFilter])

  const handleSubmit = async () => {
    try {
      const url = '/api/fleet/vehicles'
      const res = editItem
        ? await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editItem.id, ...form }) })
        : await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { toast.success(editItem ? 'Vehicle updated' : 'Vehicle created'); fetchData(); setOpen(false); setEditItem(null); setForm({}) }
      else { toast.error('Operation failed') }
    } catch (e) { toast.error('Request failed') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vehicle?')) return
    try {
      const res = await fetch(`/api/fleet/vehicles?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Vehicle deleted'); fetchData() }
    } catch (e) { toast.error('Delete failed') }
  }

  const openEdit = (item: any) => { setEditItem(item); setForm(item); setOpen(true) }
  const openCreate = () => { setEditItem(null); setForm({ vehicleNumber: '', registrationNumber: '', make: '', model: '', year: new Date().getFullYear(), category: 'sedan', fuelType: 'petrol', transmission: 'automatic', seatingCapacity: 5, mileage: 0, status: 'available', dailyRate: 0, weeklyRate: 0, monthlyRate: 0, purchasePrice: 0, currentValue: 0 }); setOpen(true) }

  const statCards = [
    { label: 'Total Vehicles', value: vehicles.length, icon: Car, color: 'text-emerald-600' },
    { label: 'Available', value: vehicles.filter(v => v.status === 'available').length, icon: Car, color: 'text-green-600' },
    { label: 'Rented', value: vehicles.filter(v => v.status === 'rented').length, icon: Car, color: 'text-blue-600' },
    { label: 'Maintenance', value: vehicles.filter(v => v.status === 'maintenance').length, icon: Car, color: 'text-red-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Vehicle Registry</h2><p className="text-sm text-muted-foreground">Manage your fleet vehicles</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Vehicle</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-muted"><s.icon className={`h-4 w-4 ${s.color}`} /></div>
              <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search vehicles..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" /></div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Filter status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="rented">Rented</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="in_service">In Service</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Vehicle #</TableHead>
                  <TableHead className="text-xs">Registration</TableHead>
                  <TableHead className="text-xs">Make/Model</TableHead>
                  <TableHead className="text-xs">Year</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Fuel</TableHead>
                  <TableHead className="text-xs">Daily Rate</TableHead>
                  <TableHead className="text-xs">Mileage</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({length: 5}).map((_,i) => (
                  <TableRow key={i}><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
                )) : vehicles.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No vehicles found. Add your first vehicle to get started.</TableCell></TableRow>
                ) : vehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="text-xs font-mono">{v.vehicleNumber}</TableCell>
                    <TableCell className="text-xs">{v.registrationNumber}</TableCell>
                    <TableCell className="text-xs font-medium">{v.make} {v.model}</TableCell>
                    <TableCell className="text-xs">{v.year}</TableCell>
                    <TableCell className="text-xs capitalize">{v.category}</TableCell>
                    <TableCell className="text-xs capitalize">{v.fuelType}</TableCell>
                    <TableCell className="text-xs">${v.dailyRate?.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{v.mileage?.toLocaleString()}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${statusColors[v.status] || ''}`}>{v.status?.replace('_', ' ')}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewItem(v)}><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(v)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(v.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle><DialogDescription>{editItem ? 'Update the vehicle details and specifications.' : 'Add a new vehicle to the fleet registry with all required details.'}</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div><Label>Vehicle Number *</Label><Input value={form.vehicleNumber || ''} onChange={e => setForm({...form, vehicleNumber: e.target.value})} className="h-10 mt-1" placeholder="e.g. V-001" required /></div>
            <div><Label>Registration Number *</Label><Input value={form.registrationNumber || ''} onChange={e => setForm({...form, registrationNumber: e.target.value})} className="h-10 mt-1" placeholder="e.g. ABC-1234" required /></div>
            <div><Label>VIN</Label><Input value={form.vin || ''} onChange={e => setForm({...form, vin: e.target.value})} className="h-10 mt-1" placeholder="Vehicle Identification Number" /></div>
            <div><Label>Make *</Label><Input value={form.make || ''} onChange={e => setForm({...form, make: e.target.value})} className="h-10 mt-1" placeholder="e.g. Toyota" required /></div>
            <div><Label>Model *</Label><Input value={form.model || ''} onChange={e => setForm({...form, model: e.target.value})} className="h-10 mt-1" placeholder="e.g. Camry" required /></div>
            <div><Label>Year</Label><Input type="number" value={form.year || ''} onChange={e => setForm({...form, year: parseInt(e.target.value)})} className="h-10 mt-1" placeholder="e.g. 2024" /></div>
            <div><Label>Category</Label>
              <Select value={form.category || 'sedan'} onValueChange={v => setForm({...form, category: v})}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent><SelectItem value="sedan">Sedan</SelectItem><SelectItem value="suv">SUV</SelectItem><SelectItem value="truck">Truck</SelectItem><SelectItem value="bus">Bus</SelectItem><SelectItem value="van">Van</SelectItem><SelectItem value="luxury">Luxury</SelectItem><SelectItem value="equipment">Equipment</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Fuel Type</Label>
              <Select value={form.fuelType || 'petrol'} onValueChange={v => setForm({...form, fuelType: v})}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                <SelectContent><SelectItem value="petrol">Petrol</SelectItem><SelectItem value="diesel">Diesel</SelectItem><SelectItem value="electric">Electric</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem><SelectItem value="cng">CNG</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Transmission</Label>
              <Select value={form.transmission || 'automatic'} onValueChange={v => setForm({...form, transmission: v})}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select transmission" /></SelectTrigger>
                <SelectContent><SelectItem value="automatic">Automatic</SelectItem><SelectItem value="manual">Manual</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Seating Capacity</Label><Input type="number" value={form.seatingCapacity || ''} onChange={e => setForm({...form, seatingCapacity: parseInt(e.target.value)})} className="h-10 mt-1" placeholder="e.g. 5" /></div>
            <div><Label>Daily Rate ($)</Label><Input type="number" value={form.dailyRate || ''} onChange={e => setForm({...form, dailyRate: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="0.00" /></div>
            <div><Label>Weekly Rate ($)</Label><Input type="number" value={form.weeklyRate || ''} onChange={e => setForm({...form, weeklyRate: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="0.00" /></div>
            <div><Label>Monthly Rate ($)</Label><Input type="number" value={form.monthlyRate || ''} onChange={e => setForm({...form, monthlyRate: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="0.00" /></div>
            <div><Label>Purchase Price ($)</Label><Input type="number" value={form.purchasePrice || ''} onChange={e => setForm({...form, purchasePrice: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="0.00" /></div>
            <div><Label>Mileage</Label><Input type="number" value={form.mileage || ''} onChange={e => setForm({...form, mileage: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="0" /></div>
            <div><Label>Status</Label>
              <Select value={form.status || 'available'} onValueChange={v => setForm({...form, status: v})}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="reserved">Reserved</SelectItem><SelectItem value="rented">Rented</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="in_service">In Service</SelectItem><SelectItem value="retired">Retired</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-1 md:col-span-2"><Label>Current Location</Label><Input value={form.currentLocation || ''} onChange={e => setForm({...form, currentLocation: e.target.value})} className="h-10 mt-1" placeholder="e.g. Main Office, Lot B" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editItem ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Vehicle Details</DialogTitle><DialogDescription>View complete vehicle information and specifications.</DialogDescription></DialogHeader>
          {viewItem && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Vehicle #:</span> <span className="font-medium">{viewItem.vehicleNumber}</span></div>
                <div><span className="text-muted-foreground">Registration:</span> <span className="font-medium">{viewItem.registrationNumber}</span></div>
                <div><span className="text-muted-foreground">Make/Model:</span> <span className="font-medium">{viewItem.make} {viewItem.model}</span></div>
                <div><span className="text-muted-foreground">Year:</span> <span className="font-medium">{viewItem.year}</span></div>
                <div><span className="text-muted-foreground">Category:</span> <span className="font-medium capitalize">{viewItem.category}</span></div>
                <div><span className="text-muted-foreground">Fuel:</span> <span className="font-medium capitalize">{viewItem.fuelType}</span></div>
                <div><span className="text-muted-foreground">Transmission:</span> <span className="font-medium capitalize">{viewItem.transmission}</span></div>
                <div><span className="text-muted-foreground">Seating:</span> <span className="font-medium">{viewItem.seatingCapacity}</span></div>
                <div><span className="text-muted-foreground">Daily Rate:</span> <span className="font-medium">${viewItem.dailyRate}</span></div>
                <div><span className="text-muted-foreground">Mileage:</span> <span className="font-medium">{viewItem.mileage?.toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge className={statusColors[viewItem.status]}>{viewItem.status}</Badge></div>
                <div><span className="text-muted-foreground">Location:</span> <span className="font-medium">{viewItem.currentLocation || 'N/A'}</span></div>
              </div>
              {viewItem.vin && <div><span className="text-muted-foreground">VIN:</span> <span className="font-mono">{viewItem.vin}</span></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
