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
import { Car, Plus, Search, Filter, Edit, Trash2, Eye, Loader2, Settings, DollarSign, FileText, CheckCircle, Wrench } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
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
  const [saving, setSaving] = useState(false)

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
    setSaving(true)
    try {
      const url = '/api/fleet/vehicles'
      const res = editItem
        ? await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editItem.id, ...form }) })
        : await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { toast.success(editItem ? 'Vehicle updated' : 'Vehicle created'); fetchData(); setOpen(false); setEditItem(null); setForm({}) }
      else { toast.error('Operation failed') }
    } catch (e) { toast.error('Request failed') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vehicle?')) return
    try {
      const res = await fetch(`/api/fleet/vehicles?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Vehicle deleted'); fetchData() }
    } catch (e) { toast.error('Delete failed') }
  }

  const openEdit = (item: any) => {
    setEditItem(item)
    setForm({
      vehicleNumber: item.vehicleNumber || '',
      registrationNumber: item.registrationNumber || '',
      vin: item.vin || '',
      make: item.make || '',
      model: item.model || '',
      year: item.year || new Date().getFullYear(),
      category: item.category || 'sedan',
      fuelType: item.fuelType || 'petrol',
      transmission: item.transmission || 'automatic',
      seatingCapacity: item.seatingCapacity || 5,
      dailyRate: item.dailyRate || 0,
      weeklyRate: item.weeklyRate || 0,
      monthlyRate: item.monthlyRate || 0,
      purchasePrice: item.purchasePrice || 0,
      mileage: item.mileage || 0,
      status: item.status || 'available',
      currentLocation: item.currentLocation || '',
    })
    setOpen(true)
  }
  const openCreate = () => { setEditItem(null); setForm({ vehicleNumber: '', registrationNumber: '', make: '', model: '', year: new Date().getFullYear(), category: 'sedan', fuelType: 'petrol', transmission: 'automatic', seatingCapacity: 5, mileage: 0, status: 'available', dailyRate: 0, weeklyRate: 0, monthlyRate: 0, purchasePrice: 0, currentValue: 0, color: '', engineNumber: '', registrationExpiry: '', insuranceExpiry: '', lastServiceDate: '', nextServiceDate: '', notes: '' }); setOpen(true) }

  const statCards = [
    { label: 'Total Vehicles', value: vehicles.length, icon: Car, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Available', value: vehicles.filter(v => v.status === 'available').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
    { label: 'Rented', value: vehicles.filter(v => v.status === 'rented').length, icon: Car, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Maintenance', value: vehicles.filter(v => v.status === 'maintenance').length, icon: Wrench, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Vehicle Registry</CardTitle>
              <CardDescription>Manage your fleet vehicles</CardDescription>
            </div>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Vehicle</Button>
          </div>
        </CardHeader>
      </Card>

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
          <ScrollArea className="max-h-[440px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Vehicle #</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Registration</TableHead>
                  <TableHead className="text-xs">Make/Model</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Year</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Category</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Fuel</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Daily Rate</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Mileage</TableHead>
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
                    <TableCell className="text-xs hidden md:table-cell">{v.registrationNumber}</TableCell>
                    <TableCell className="text-xs font-medium">{v.make} {v.model}</TableCell>
                    <TableCell className="text-xs hidden lg:table-cell">{v.year}</TableCell>
                    <TableCell className="text-xs hidden lg:table-cell capitalize">{v.category}</TableCell>
                    <TableCell className="text-xs hidden lg:table-cell capitalize">{v.fuelType}</TableCell>
                    <TableCell className="text-xs hidden md:table-cell">${v.dailyRate?.toLocaleString()}</TableCell>
                    <TableCell className="text-xs hidden lg:table-cell">{v.mileage?.toLocaleString()}</TableCell>
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
      <Dialog open={open} onOpenChange={(v) => { if (!saving) setOpen(v) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle><DialogDescription>{editItem ? 'Update the vehicle details and specifications.' : 'Add a new vehicle to the fleet registry with all required details.'}</DialogDescription></DialogHeader>
          <div className="space-y-6 py-2">
            {/* Section: Vehicle Details */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Car className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Vehicle Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Vehicle Number *</Label><Input value={form.vehicleNumber || ''} onChange={e => setForm({...form, vehicleNumber: e.target.value})} className="h-10 mt-1" placeholder="e.g. V-001" required /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Registration Number *</Label><Input value={form.registrationNumber || ''} onChange={e => setForm({...form, registrationNumber: e.target.value})} className="h-10 mt-1" placeholder="e.g. ABC-1234" required /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Make *</Label><Input value={form.make || ''} onChange={e => setForm({...form, make: e.target.value})} className="h-10 mt-1" placeholder="e.g. Toyota" required /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Model *</Label><Input value={form.model || ''} onChange={e => setForm({...form, model: e.target.value})} className="h-10 mt-1" placeholder="e.g. Camry" required /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Year</Label><Input type="number" value={form.year || ''} onChange={e => setForm({...form, year: parseInt(e.target.value)})} className="h-10 mt-1" placeholder="e.g. 2024" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Category</Label>
                  <Select value={form.category || 'sedan'} onValueChange={v => setForm({...form, category: v})}>
                    <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent><SelectItem value="sedan">Sedan</SelectItem><SelectItem value="suv">SUV</SelectItem><SelectItem value="truck">Truck</SelectItem><SelectItem value="bus">Bus</SelectItem><SelectItem value="van">Van</SelectItem><SelectItem value="luxury">Luxury</SelectItem><SelectItem value="equipment">Equipment</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs font-medium text-muted-foreground">Color</Label><Input value={form.color || ''} onChange={e => setForm({...form, color: e.target.value})} className="h-10 mt-1" placeholder="e.g. White, Black, Silver" /></div>
              </div>
            </div>

            {/* Section: Specifications */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Settings className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Specifications</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">VIN</Label><Input value={form.vin || ''} onChange={e => setForm({...form, vin: e.target.value})} className="h-10 mt-1" placeholder="Vehicle Identification Number" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Engine Number</Label><Input value={form.engineNumber || ''} onChange={e => setForm({...form, engineNumber: e.target.value})} className="h-10 mt-1" placeholder="e.g. ENG-123456" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Transmission</Label>
                  <Select value={form.transmission || 'automatic'} onValueChange={v => setForm({...form, transmission: v})}>
                    <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select transmission" /></SelectTrigger>
                    <SelectContent><SelectItem value="automatic">Automatic</SelectItem><SelectItem value="manual">Manual</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs font-medium text-muted-foreground">Fuel Type</Label>
                  <Select value={form.fuelType || 'petrol'} onValueChange={v => setForm({...form, fuelType: v})}>
                    <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                    <SelectContent><SelectItem value="petrol">Petrol</SelectItem><SelectItem value="diesel">Diesel</SelectItem><SelectItem value="electric">Electric</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem><SelectItem value="cng">CNG</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs font-medium text-muted-foreground">Mileage</Label><Input type="number" value={form.mileage || ''} onChange={e => setForm({...form, mileage: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="0" /></div>
              </div>
            </div>

            {/* Section: Financial */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <DollarSign className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Financial</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Daily Rate ($)</Label><Input type="number" value={form.dailyRate || ''} onChange={e => setForm({...form, dailyRate: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="0.00" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Weekly Rate ($)</Label><Input type="number" value={form.weeklyRate || ''} onChange={e => setForm({...form, weeklyRate: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="0.00" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Monthly Rate ($)</Label><Input type="number" value={form.monthlyRate || ''} onChange={e => setForm({...form, monthlyRate: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="0.00" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Status</Label>
                  <Select value={form.status || 'available'} onValueChange={v => setForm({...form, status: v})}>
                    <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent><SelectItem value="available">Available</SelectItem><SelectItem value="reserved">Reserved</SelectItem><SelectItem value="rented">Rented</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="in_service">In Service</SelectItem><SelectItem value="retired">Retired</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs font-medium text-muted-foreground">Current Location</Label><Input value={form.currentLocation || ''} onChange={e => setForm({...form, currentLocation: e.target.value})} className="h-10 mt-1" placeholder="e.g. Main Office, Lot B" /></div>
              </div>
            </div>

            {/* Section: Additional */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Additional</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Last Service Date</Label><Input type="date" value={form.lastServiceDate ? form.lastServiceDate.split('T')[0] : ''} onChange={e => setForm({...form, lastServiceDate: e.target.value})} className="h-10 mt-1" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Next Service Date</Label><Input type="date" value={form.nextServiceDate ? form.nextServiceDate.split('T')[0] : ''} onChange={e => setForm({...form, nextServiceDate: e.target.value})} className="h-10 mt-1" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Insurance Expiry</Label><Input type="date" value={form.insuranceExpiry ? form.insuranceExpiry.split('T')[0] : ''} onChange={e => setForm({...form, insuranceExpiry: e.target.value})} className="h-10 mt-1" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Registration Expiry</Label><Input type="date" value={form.registrationExpiry ? form.registrationExpiry.split('T')[0] : ''} onChange={e => setForm({...form, registrationExpiry: e.target.value})} className="h-10 mt-1" /></div>
                <div className="col-span-1 md:col-span-2"><Label className="text-xs font-medium text-muted-foreground">Notes</Label><Textarea value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} className="h-10 mt-1 min-h-[80px]" placeholder="Additional notes about this vehicle..." /></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editItem ? 'Update' : 'Create'}</Button>
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
