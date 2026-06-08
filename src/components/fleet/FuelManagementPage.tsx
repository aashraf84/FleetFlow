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
import { Fuel, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'

export default function FuelManagementPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [fuelRes, vehRes, driRes] = await Promise.all([
        fetch('/api/fleet/fuel'),
        fetch('/api/fleet/vehicles'),
        fetch('/api/fleet/drivers')
      ])
      if (fuelRes.ok) { const j = await fuelRes.json(); setRecords(j.data || []) }
      if (vehRes.ok) { const j = await vehRes.json(); setVehicles(j.data || []) }
      if (driRes.ok) { const j = await driRes.json(); setDrivers(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const payload = { ...form, totalCost: (form.quantity || 0) * (form.costPerUnit || 0) }
      if (editMode && form.id) {
        const res = await fetch('/api/fleet/fuel', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) { toast.success('Fuel record updated'); fetchData(); setOpen(false); setForm({}) }
        else toast.error('Failed to update')
      } else {
        const res = await fetch('/api/fleet/fuel', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) { toast.success('Fuel record added'); fetchData(); setOpen(false); setForm({}) }
        else toast.error('Failed')
      }
    } catch (e) { toast.error('Request failed') } finally { setSaving(false) }
  }

  const handleEdit = (record: any) => {
    setForm({
      id: record.id,
      vehicleId: record.vehicleId,
      driverId: record.driverId || '',
      fuelType: record.fuelType || 'petrol',
      quantity: record.quantity,
      costPerUnit: record.unitPrice || record.costPerUnit || 0,
      vendor: record.station || record.vendor || '',
      date: record.date ? new Date(record.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    })
    setEditMode(true)
    setOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/fleet/fuel?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Fuel record deleted'); fetchData() }
      else toast.error('Failed to delete')
    } catch (e) { toast.error('Delete failed') } finally { setDeleteOpen(false); setDeleteId(null) }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`
  const totalCost = records.reduce((s, r) => s + (r.totalCost || 0), 0)
  const totalLiters = records.reduce((s, r) => s + (r.quantity || 0), 0)

  const fuelByVehicle = Object.entries(records.reduce((acc: any, r) => {
    const key = r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : 'Unknown'
    acc[key] = (acc[key] || 0) + (r.totalCost || 0)
    return acc
  }, {})).map(([vehicle, cost]) => ({ vehicle, cost: cost as number })).sort((a, b) => b.cost - a.cost).slice(0, 10)

  const filtered = records.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (r.vehicle && `${r.vehicle.make} ${r.vehicle.model}`.toLowerCase().includes(q)) ||
      (r.driver && `${r.driver.firstName} ${r.driver.lastName}`.toLowerCase().includes(q)) ||
      (r.fuelType && r.fuelType.toLowerCase().includes(q)) ||
      (r.station && r.station.toLowerCase().includes(q))
    )
  })

  const stats = [
    { label: 'Total Records', value: records.length },
    { label: 'Total Cost', value: fmt(totalCost) },
    { label: 'Total Fuel', value: `${totalLiters.toLocaleString()}L` },
    { label: 'Avg Cost/Fill', value: records.length > 0 ? fmt(totalCost / records.length) : '$0' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Fuel Management</h2><p className="text-sm text-muted-foreground">Track fuel purchases, usage, and costs</p></div>
        <Button onClick={() => { setForm({ fuelType: 'petrol', quantity: 0, costPerUnit: 0, totalCost: 0, date: new Date().toISOString().split('T')[0] }); setEditMode(false); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />Add Fuel Record</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Fuel Cost by Vehicle</CardTitle></CardHeader>
          <CardContent>
            {fuelByVehicle.length > 0 ? (
              <div className="h-64"><ResponsiveContainer width="100%" height="100%">
                <BarChart data={fuelByVehicle} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis type="number" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" /><YAxis dataKey="vehicle" type="category" width={100} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" /><RTooltip /><Bar dataKey="cost" fill="#f59e0b" radius={[0, 4, 4, 0]} /></BarChart>
              </ResponsiveContainer></div>
            ) : <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">No fuel data available</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Recent Fuel Records</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-64">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-xs">Vehicle</TableHead><TableHead className="text-xs">Driver</TableHead><TableHead className="text-xs">Quantity</TableHead>
                  <TableHead className="text-xs">Cost</TableHead><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs w-20">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filtered.slice(0, 15).map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : 'N/A'}</TableCell>
                      <TableCell className="text-xs">{r.driver ? `${r.driver.firstName} ${r.driver.lastName}` : 'N/A'}</TableCell>
                      <TableCell className="text-xs">{r.quantity}L</TableCell>
                      <TableCell className="text-xs font-medium">{fmt(r.totalCost)}</TableCell>
                      <TableCell className="text-xs">{new Date(r.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(r)}><Pencil className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setDeleteId(r.id); setDeleteOpen(true) }}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!saving) setOpen(v) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit Fuel Record' : 'Add Fuel Record'}</DialogTitle>
            <DialogDescription>{editMode ? 'Update the fuel record details below.' : 'Fill in the details to add a new fuel record.'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div><Label className="text-xs">Vehicle <span className="text-destructive">*</span></Label><Select value={form.vehicleId || ''} onValueChange={v => setForm({...form, vehicleId: v})} required><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger><SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.make} {v.model}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Driver</Label><Select value={form.driverId || ''} onValueChange={v => setForm({...form, driverId: v})}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select driver" /></SelectTrigger><SelectContent>{drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Fuel Type <span className="text-destructive">*</span></Label><Select value={form.fuelType || 'petrol'} onValueChange={v => setForm({...form, fuelType: v})} required><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select fuel type" /></SelectTrigger><SelectContent><SelectItem value="petrol">Petrol</SelectItem><SelectItem value="diesel">Diesel</SelectItem><SelectItem value="electric">Electric</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Quantity (L) <span className="text-destructive">*</span></Label><Input type="number" value={form.quantity || ''} onChange={e => setForm({...form, quantity: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="e.g. 50" required /></div>
            <div><Label className="text-xs">Cost Per Unit ($) <span className="text-destructive">*</span></Label><Input type="number" value={form.costPerUnit || ''} onChange={e => setForm({...form, costPerUnit: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="e.g. 1.50" required /></div>
            <div><Label className="text-xs">Station/Vendor</Label><Input value={form.vendor || ''} onChange={e => setForm({...form, vendor: e.target.value})} className="h-10 mt-1" placeholder="e.g. Shell Station" /></div>
            <div><Label className="text-xs">Date <span className="text-destructive">*</span></Label><Input type="date" value={form.date || ''} onChange={e => setForm({...form, date: e.target.value})} className="h-10 mt-1" required /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editMode ? 'Update' : 'Add Record'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Fuel Record</DialogTitle><DialogDescription>This action cannot be undone.</DialogDescription></DialogHeader>
          <p className="text-sm text-muted-foreground py-4">Are you sure you want to delete this fuel record? This action cannot be undone.</p>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
