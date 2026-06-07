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
import { Shield, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function InsurancePage() {
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [form, setForm] = useState<any>({})

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try {
      const [insRes, vehRes] = await Promise.all([fetch('/api/fleet/insurance?XTransformPort=3000'), fetch('/api/fleet/vehicles?XTransformPort=3000')])
      if (insRes.ok) { const j = await insRes.json(); setPolicies(j.data || []) }
      if (vehRes.ok) { const j = await vehRes.json(); setVehicles(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/fleet/insurance?XTransformPort=3000', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { toast.success('Policy created'); fetchData(); setOpen(false); setForm({}) } else toast.error('Failed')
    } catch (e) { toast.error('Failed') }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`
  const now = new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Insurance</h2><p className="text-sm text-muted-foreground">Manage insurance policies for your fleet</p></div>
        <Button onClick={() => { setForm({ type: 'comprehensive', premium: 0, status: 'active' }); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />Add Policy</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Policies', value: policies.length },
          { label: 'Active', value: policies.filter(p => p.status === 'active').length },
          { label: 'Expiring Soon', value: policies.filter(p => new Date(p.endDate) < new Date(now.getTime() + 30 * 86400000) && p.status === 'active').length },
          { label: 'Total Premiums', value: fmt(policies.filter(p => p.status === 'active').reduce((s, p) => s + (p.premium || 0), 0)) },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Vehicle</TableHead><TableHead className="text-xs">Policy #</TableHead><TableHead className="text-xs">Provider</TableHead>
            <TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Premium</TableHead><TableHead className="text-xs">Expiry</TableHead><TableHead className="text-xs">Status</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
            policies.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No insurance policies</TableCell></TableRow> :
            policies.map(p => (
              <TableRow key={p.id}>
                <TableCell className="text-xs font-medium">{p.vehicle ? `${p.vehicle.make} ${p.vehicle.model}` : 'N/A'}</TableCell>
                <TableCell className="text-xs font-mono">{p.policyNumber}</TableCell>
                <TableCell className="text-xs">{p.provider}</TableCell>
                <TableCell className="text-xs capitalize">{p.type}</TableCell>
                <TableCell className="text-xs font-medium">{fmt(p.premium)}</TableCell>
                <TableCell className="text-xs">{new Date(p.endDate).toLocaleDateString()}</TableCell>
                <TableCell><Badge className={`text-[10px] ${p.status === 'active' ? 'bg-emerald-100 text-emerald-800' : p.status === 'expired' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{p.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Insurance Policy</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label className="text-xs">Vehicle</Label><Select value={form.vehicleId || ''} onValueChange={v => setForm({...form, vehicleId: v})}><SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger><SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.make} {v.model}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Policy Number</Label><Input value={form.policyNumber || ''} onChange={e => setForm({...form, policyNumber: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Provider</Label><Input value={form.provider || ''} onChange={e => setForm({...form, provider: e.target.value})} className="h-9 mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Start Date</Label><Input type="date" value={form.startDate || ''} onChange={e => setForm({...form, startDate: e.target.value})} className="h-9 mt-1" /></div>
              <div><Label className="text-xs">End Date</Label><Input type="date" value={form.endDate || ''} onChange={e => setForm({...form, endDate: e.target.value})} className="h-9 mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Premium ($)</Label><Input type="number" value={form.premium || ''} onChange={e => setForm({...form, premium: parseFloat(e.target.value)})} className="h-9 mt-1" /></div>
              <div><Label className="text-xs">Type</Label><Select value={form.type || 'comprehensive'} onValueChange={v => setForm({...form, type: v})}><SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="liability">Liability</SelectItem><SelectItem value="comprehensive">Comprehensive</SelectItem><SelectItem value="collision">Collision</SelectItem><SelectItem value="personal_injury">Personal Injury</SelectItem></SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
