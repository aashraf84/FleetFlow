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
import { Fuel, Plus, Search } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'

export default function FuelManagementPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [form, setForm] = useState<any>({})

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
    try {
      const res = await fetch('/api/fleet/fuel', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, totalCost: (form.quantity || 0) * (form.costPerUnit || 0) })
      })
      if (res.ok) { toast.success('Fuel record added'); fetchData(); setOpen(false); setForm({}) }
      else toast.error('Failed')
    } catch (e) { toast.error('Request failed') }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`
  const totalCost = records.reduce((s, r) => s + (r.totalCost || 0), 0)
  const totalLiters = records.reduce((s, r) => s + (r.quantity || 0), 0)

  const fuelByVehicle = Object.entries(records.reduce((acc: any, r) => {
    const key = r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : 'Unknown'
    acc[key] = (acc[key] || 0) + (r.totalCost || 0)
    return acc
  }, {})).map(([vehicle, cost]) => ({ vehicle, cost: cost as number })).sort((a, b) => b.cost - a.cost).slice(0, 10)

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
        <Button onClick={() => { setForm({ fuelType: 'petrol', quantity: 0, costPerUnit: 0, totalCost: 0 }); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />Add Fuel Record</Button>
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
                  <TableHead className="text-xs">Cost</TableHead><TableHead className="text-xs">Date</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {records.slice(0, 15).map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : 'N/A'}</TableCell>
                      <TableCell className="text-xs">{r.driver ? `${r.driver.firstName} ${r.driver.lastName}` : 'N/A'}</TableCell>
                      <TableCell className="text-xs">{r.quantity}L</TableCell>
                      <TableCell className="text-xs font-medium">{fmt(r.totalCost)}</TableCell>
                      <TableCell className="text-xs">{new Date(r.date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Fuel Record</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label className="text-xs">Vehicle</Label><Select value={form.vehicleId || ''} onValueChange={v => setForm({...form, vehicleId: v})}><SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger><SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.make} {v.model}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Driver</Label><Select value={form.driverId || ''} onValueChange={v => setForm({...form, driverId: v})}><SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Select driver" /></SelectTrigger><SelectContent>{drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.firstName} {d.lastName}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Fuel Type</Label><Select value={form.fuelType || 'petrol'} onValueChange={v => setForm({...form, fuelType: v})}><SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="petrol">Petrol</SelectItem><SelectItem value="diesel">Diesel</SelectItem><SelectItem value="electric">Electric</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Quantity (L)</Label><Input type="number" value={form.quantity || ''} onChange={e => setForm({...form, quantity: parseFloat(e.target.value)})} className="h-9 mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Cost Per Unit ($)</Label><Input type="number" value={form.costPerUnit || ''} onChange={e => setForm({...form, costPerUnit: parseFloat(e.target.value)})} className="h-9 mt-1" /></div>
              <div><Label className="text-xs">Vendor</Label><Input value={form.vendor || ''} onChange={e => setForm({...form, vendor: e.target.value})} className="h-9 mt-1" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Add Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
