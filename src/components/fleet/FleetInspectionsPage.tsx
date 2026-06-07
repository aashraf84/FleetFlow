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
import { ClipboardCheck, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function FleetInspectionsPage() {
  const [inspections, setInspections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [form, setForm] = useState<any>({})

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [inspRes, vehRes] = await Promise.all([
        fetch('/api/fleet/inspections'),
        fetch('/api/fleet/vehicles')
      ])
      if (inspRes.ok) { const json = await inspRes.json(); setInspections(json.data || []) }
      if (vehRes.ok) { const json = await vehRes.json(); setVehicles(json.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/fleet/inspections', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      if (res.ok) { toast.success('Inspection created'); fetchData(); setOpen(false); setForm({}) }
      else toast.error('Failed')
    } catch (e) { toast.error('Request failed') }
  }

  const stats = [
    { label: 'Total Inspections', value: inspections.length },
    { label: 'Passed', value: inspections.filter(i => i.status === 'passed').length },
    { label: 'Failed', value: inspections.filter(i => i.status === 'failed').length },
    { label: 'Pending', value: inspections.filter(i => i.status === 'pending').length },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Inspections</h2><p className="text-sm text-muted-foreground">Vehicle inspection records</p></div>
        <Button onClick={() => { setForm({ inspectorName: '', type: 'routine', status: 'pending' }); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />New Inspection</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Vehicle</TableHead>
                <TableHead className="text-xs">Inspector</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Next Due</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Findings</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
                inspections.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No inspections recorded</TableCell></TableRow> :
                inspections.map(i => (
                  <TableRow key={i.id}>
                    <TableCell className="text-xs font-medium">{i.vehicle ? `${i.vehicle.make} ${i.vehicle.model}` : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{i.inspectorName}</TableCell>
                    <TableCell className="text-xs capitalize">{i.type?.replace('_', ' ')}</TableCell>
                    <TableCell className="text-xs">{i.inspectionDate ? new Date(i.inspectionDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{i.nextDueDate ? new Date(i.nextDueDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell><Badge variant={i.status === 'passed' ? 'default' : i.status === 'failed' ? 'destructive' : 'outline'} className="text-[10px]">{i.status}</Badge></TableCell>
                    <TableCell className="text-xs max-w-48 truncate">{i.findings || i.notes || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Inspection</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label className="text-xs">Vehicle</Label><Select value={form.vehicleId || ''} onValueChange={v => setForm({...form, vehicleId: v})}><SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger><SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.make} {v.model} ({v.vehicleNumber})</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Inspector Name</Label><Input value={form.inspectorName || ''} onChange={e => setForm({...form, inspectorName: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Type</Label><Select value={form.type || 'routine'} onValueChange={v => setForm({...form, type: v})}><SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="routine">Routine</SelectItem><SelectItem value="safety">Safety</SelectItem><SelectItem value="emissions">Emissions</SelectItem><SelectItem value="pre_rental">Pre-Rental</SelectItem><SelectItem value="post_rental">Post-Rental</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Findings</Label><Input value={form.findings || ''} onChange={e => setForm({...form, findings: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Status</Label><Select value={form.status || 'pending'} onValueChange={v => setForm({...form, status: v})}><SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="passed">Passed</SelectItem><SelectItem value="failed">Failed</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
