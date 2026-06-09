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
import { Shield, CalendarDays, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function CompliancePage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try {
      const [compRes, vehRes] = await Promise.all([fetch('/api/fleet/compliance'), fetch('/api/fleet/vehicles')])
      if (compRes.ok) { const j = await compRes.json(); setRecords(j.data || []) }
      if (vehRes.ok) { const j = await vehRes.json(); setVehicles(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (editMode && form.id) {
        const res = await fetch('/api/fleet/compliance', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        if (res.ok) { toast.success('Compliance record updated'); fetchData(); setOpen(false); setForm({}) }
        else toast.error('Failed to update')
      } else {
        const res = await fetch('/api/fleet/compliance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        if (res.ok) { toast.success('Compliance record created'); fetchData(); setOpen(false); setForm({}) } else toast.error('Failed')
      }
    } catch (e) { toast.error('Failed') } finally { setSaving(false) }
  }

  const handleEdit = (record: any) => {
    setForm({
      id: record.id,
      vehicleId: record.vehicleId,
      type: record.type,
      documentNumber: record.documentNumber || record.certificateNumber || '',
      certificateNumber: record.certificateNumber || record.documentNumber || '',
      expiryDate: record.expiryDate ? new Date(record.expiryDate).toISOString().split('T')[0] : '',
      issueDate: record.issueDate ? new Date(record.issueDate).toISOString().split('T')[0] : '',
      issuingAuthority: record.issuingAuthority || '',
      status: record.status,
      notes: record.notes || '',
    })
    setEditMode(true)
    setOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/fleet/compliance?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Compliance record deleted'); fetchData() }
      else toast.error('Failed to delete')
    } catch (e) { toast.error('Delete failed') } finally { setDeleteOpen(false); setDeleteId(null) }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/fleet/compliance', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      if (res.ok) {
        toast.success(`Status changed to ${status.replace('_', ' ')}`)
        fetchData()
      } else toast.error('Failed to update status')
    } catch (e) { toast.error('Status update failed') }
  }

  const now = new Date()
  const expiringSoon = records.filter(r => new Date(r.expiryDate) < new Date(now.getTime() + 30 * 86400000) && r.status === 'valid')

  const statusBadge = (status: string) => {
    const cls = status === 'valid' ? 'bg-emerald-100 text-emerald-800' :
      status === 'expired' ? 'bg-red-100 text-red-800' :
      status === 'pending' ? 'bg-amber-100 text-amber-800' :
      'bg-orange-100 text-orange-800'
    return <Badge className={`text-[10px] ${cls}`}>{status?.replace('_', ' ')}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Compliance</h2><p className="text-sm text-muted-foreground">Road taxes, permits, fitness certificates, and vehicle compliance</p></div>
        <Button onClick={() => { setForm({ type: 'road_tax', status: 'valid', reminderDays: 30 }); setEditMode(false); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />Add Record</Button>
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
              <span className="text-muted-foreground">{r.type?.replace('_', ' ')} expires {new Date(r.expiryDate).toLocaleDateString()}</span>
              <Button variant="outline" size="sm" className="h-6 text-[10px] ml-2" onClick={() => handleStatusChange(r.id, 'renewal_required')}>Mark Renewal</Button>
            </div>
          ))}</div></CardContent>
        </Card>
      )}
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Vehicle</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Certificate #</TableHead>
            <TableHead className="text-xs">Expiry</TableHead><TableHead className="text-xs">Authority</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs w-36">Actions</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
            records.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No compliance records</TableCell></TableRow> :
            records.map(r => (
              <TableRow key={r.id} className={r.status === 'expired' ? 'bg-red-50/50 dark:bg-red-950/10' : r.status === 'renewal_required' ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}>
                <TableCell className="text-xs font-medium">{r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : 'N/A'}</TableCell>
                <TableCell className="text-xs capitalize">{r.type?.replace('_', ' ')}</TableCell>
                <TableCell className="text-xs font-mono">{r.documentNumber || r.certificateNumber || 'N/A'}</TableCell>
                <TableCell className="text-xs">{new Date(r.expiryDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-xs">{r.issuingAuthority || 'N/A'}</TableCell>
                <TableCell>{statusBadge(r.status)}</TableCell>
                <TableCell className="text-xs">
                  <div className="flex items-center gap-1 flex-wrap">
                    {r.status === 'valid' && (
                      <>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-red-600" onClick={() => handleStatusChange(r.id, 'expired')}>Expire</Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-orange-600" onClick={() => handleStatusChange(r.id, 'renewal_required')}>Renewal Req</Button>
                      </>
                    )}
                    {(r.status === 'expired' || r.status === 'renewal_required') && (
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] text-emerald-600" onClick={() => handleStatusChange(r.id, 'valid')}>Renew</Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(r)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setDeleteId(r.id); setDeleteOpen(true) }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!saving) setOpen(v) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit Compliance Record' : 'Add Compliance Record'}</DialogTitle>
            <DialogDescription>{editMode ? 'Update the compliance record details below.' : 'Fill in the details to add a new compliance record.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Vehicle & Type */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Vehicle & Type</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Vehicle <span className="text-destructive">*</span></Label><Select value={form.vehicleId || ''} onValueChange={v => setForm({...form, vehicleId: v})} required><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger><SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.make} {v.model}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Type <span className="text-destructive">*</span></Label><Select value={form.type || 'road_tax'} onValueChange={v => setForm({...form, type: v})} required><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="road_tax">Road Tax</SelectItem><SelectItem value="permit">Permit</SelectItem><SelectItem value="fitness_certificate">Fitness Certificate</SelectItem><SelectItem value="emission">Emission</SelectItem><SelectItem value="registration">Registration</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Document/Certificate Number <span className="text-destructive">*</span></Label><Input value={form.certificateNumber || form.documentNumber || ''} onChange={e => setForm({...form, certificateNumber: e.target.value, documentNumber: e.target.value})} className="h-10 mt-1" placeholder="e.g. CERT-2024-001" required /></div>
              </div>
            </div>

            {/* Dates & Authority */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Dates & Authority</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Issue Date</Label><Input type="date" value={form.issueDate || ''} onChange={e => setForm({...form, issueDate: e.target.value})} className="h-10 mt-1" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Expiry Date <span className="text-destructive">*</span></Label><Input type="date" value={form.expiryDate || ''} onChange={e => setForm({...form, expiryDate: e.target.value})} className="h-10 mt-1" required /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Issuing Authority</Label><Input value={form.issuingAuthority || ''} onChange={e => setForm({...form, issuingAuthority: e.target.value})} className="h-10 mt-1" placeholder="e.g. DMV, Transport Authority" /></div>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editMode ? 'Update' : 'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Compliance Record</DialogTitle><DialogDescription>This action cannot be undone.</DialogDescription></DialogHeader>
          <p className="text-sm text-muted-foreground py-4">Are you sure you want to delete this compliance record? This action cannot be undone.</p>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
