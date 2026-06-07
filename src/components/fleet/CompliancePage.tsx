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
import { FileCheck, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function CompliancePage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [form, setForm] = useState<any>({})

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try {
      const [compRes, vehRes] = await Promise.all([fetch('/api/fleet/compliance?XTransformPort=3000'), fetch('/api/fleet/vehicles?XTransformPort=3000')])
      if (compRes.ok) { const j = await compRes.json(); setRecords(j.data || []) }
      if (vehRes.ok) { const j = await vehRes.json(); setVehicles(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/fleet/compliance?XTransformPort=3000', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { toast.success('Compliance record created'); fetchData(); setOpen(false); setForm({}) } else toast.error('Failed')
    } catch (e) { toast.error('Failed') }
  }

  const now = new Date()
  const expiringSoon = records.filter(r => new Date(r.expiryDate) < new Date(now.getTime() + 30 * 86400000) && r.status === 'valid')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Compliance</h2><p className="text-sm text-muted-foreground">Road taxes, permits, fitness certificates, and vehicle compliance</p></div>
        <Button onClick={() => { setForm({ type: 'road_tax', status: 'valid', reminderDays: 30 }); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />Add Record</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: records.length },
          { label: 'Valid', value: records.filter(r => r.status === 'valid').length },
          { label: 'Expiring Soon', value: expiringSoon.length },
          { label: 'Expired', value: records.filter(r => r.status === 'expired').length },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      {expiringSoon.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-base text-amber-700 dark:text-amber-400">⚠️ Expiring Soon</CardTitle></CardHeader>
          <CardContent><div className="space-y-1">{expiringSoon.map(r => (
            <div key={r.id} className="text-xs flex items-center gap-2">
              <span className="font-medium">{r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : 'N/A'}</span>
              <span className="text-muted-foreground">{r.type} expires {new Date(r.expiryDate).toLocaleDateString()}</span>
            </div>
          ))}</div></CardContent>
        </Card>
      )}
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Vehicle</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Certificate #</TableHead>
            <TableHead className="text-xs">Expiry</TableHead><TableHead className="text-xs">Authority</TableHead><TableHead className="text-xs">Status</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow> :
            records.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No compliance records</TableCell></TableRow> :
            records.map(r => (
              <TableRow key={r.id}>
                <TableCell className="text-xs font-medium">{r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : 'N/A'}</TableCell>
                <TableCell className="text-xs capitalize">{r.type?.replace('_', ' ')}</TableCell>
                <TableCell className="text-xs font-mono">{r.certificateNumber || 'N/A'}</TableCell>
                <TableCell className="text-xs">{new Date(r.expiryDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-xs">{r.issuingAuthority || 'N/A'}</TableCell>
                <TableCell><Badge className={`text-[10px] ${r.status === 'valid' ? 'bg-emerald-100 text-emerald-800' : r.status === 'expired' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{r.status?.replace('_', ' ')}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Compliance Record</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label className="text-xs">Vehicle</Label><Select value={form.vehicleId || ''} onValueChange={v => setForm({...form, vehicleId: v})}><SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger><SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.make} {v.model}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Type</Label><Select value={form.type || 'road_tax'} onValueChange={v => setForm({...form, type: v})}><SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="road_tax">Road Tax</SelectItem><SelectItem value="permit">Permit</SelectItem><SelectItem value="fitness_certificate">Fitness Certificate</SelectItem><SelectItem value="emission">Emission</SelectItem><SelectItem value="registration">Registration</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Certificate Number</Label><Input value={form.certificateNumber || ''} onChange={e => setForm({...form, certificateNumber: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Expiry Date</Label><Input type="date" value={form.expiryDate || ''} onChange={e => setForm({...form, expiryDate: e.target.value})} className="h-9 mt-1" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
