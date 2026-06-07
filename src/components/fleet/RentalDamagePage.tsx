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
import { AlertTriangle, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  reported: 'bg-red-100 text-red-800', assessed: 'bg-amber-100 text-amber-800',
  repairing: 'bg-blue-100 text-blue-800', repaired: 'bg-emerald-100 text-emerald-800', closed: 'bg-gray-100 text-gray-800',
}

export default function RentalDamagePage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [form, setForm] = useState<any>({})

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [dmgRes, vehRes] = await Promise.all([
        fetch('/api/fleet/damage'),
        fetch('/api/fleet/vehicles')
      ])
      if (dmgRes.ok) { const j = await dmgRes.json(); setReports(j.data || []) }
      if (vehRes.ok) { const j = await vehRes.json(); setVehicles(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/fleet/damage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      if (res.ok) { toast.success('Damage report created'); fetchData(); setOpen(false); setForm({}) }
      else toast.error('Failed')
    } catch (e) { toast.error('Request failed') }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/fleet/damage', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status })
      })
      if (res.ok) { toast.success('Status updated'); fetchData() }
    } catch (e) { toast.error('Update failed') }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`
  const stats = [
    { label: 'Total Reports', value: reports.length },
    { label: 'Open', value: reports.filter(r => r.status === 'reported' || r.status === 'assessed').length },
    { label: 'Repairing', value: reports.filter(r => r.status === 'repairing').length },
    { label: 'Total Liability', value: fmt(reports.reduce((s, r) => s + (r.customerLiability || 0), 0)) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Damage Management</h2><p className="text-sm text-muted-foreground">Track vehicle damage reports and repairs</p></div>
        <Button onClick={() => { setForm({ description: '', status: 'reported' }); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />New Report</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card>
        <CardHeader className="pb-3"><div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" /></div></CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Vehicle</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs">Repair Estimate</TableHead>
                <TableHead className="text-xs">Actual Cost</TableHead>
                <TableHead className="text-xs">Liability</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow> :
                reports.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No damage reports</TableCell></TableRow> :
                reports.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs font-medium">{r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{r.customer ? `${r.customer.firstName} ${r.customer.lastName}` : 'N/A'}</TableCell>
                    <TableCell className="text-xs max-w-48 truncate">{r.description}</TableCell>
                    <TableCell className="text-xs">{fmt(r.repairEstimate)}</TableCell>
                    <TableCell className="text-xs">{fmt(r.repairCost)}</TableCell>
                    <TableCell className="text-xs font-medium">{fmt(r.customerLiability)}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${statusColors[r.status] || ''}`}>{r.status}</Badge></TableCell>
                    <TableCell>
                      {r.status === 'reported' && <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateStatus(r.id, 'assessed')}>Assess</Button>}
                      {r.status === 'assessed' && <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateStatus(r.id, 'repairing')}>Start Repair</Button>}
                      {r.status === 'repairing' && <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateStatus(r.id, 'repaired')}>Complete</Button>}
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
          <DialogHeader><DialogTitle>New Damage Report</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label className="text-xs">Vehicle</Label><Select value={form.vehicleId || ''} onValueChange={v => setForm({...form, vehicleId: v})}><SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger><SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.make} {v.model}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Description</Label><Input value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="h-9 mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Repair Estimate ($)</Label><Input type="number" value={form.repairEstimate || ''} onChange={e => setForm({...form, repairEstimate: parseFloat(e.target.value)})} className="h-9 mt-1" /></div>
              <div><Label className="text-xs">Customer Liability ($)</Label><Input type="number" value={form.customerLiability || ''} onChange={e => setForm({...form, customerLiability: parseFloat(e.target.value)})} className="h-9 mt-1" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
