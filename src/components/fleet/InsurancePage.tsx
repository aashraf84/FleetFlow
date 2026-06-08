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
import { Shield, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function InsurancePage() {
  const [policies, setPolicies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [vehicles, setVehicles] = useState<any[]>([])
  const [form, setForm] = useState<any>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try {
      const [insRes, vehRes] = await Promise.all([fetch('/api/fleet/insurance'), fetch('/api/fleet/vehicles')])
      if (insRes.ok) { const j = await insRes.json(); setPolicies(j.data || []) }
      if (vehRes.ok) { const j = await vehRes.json(); setVehicles(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    try {
      if (editMode && form.id) {
        const res = await fetch('/api/fleet/insurance', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        if (res.ok) { toast.success('Policy updated'); fetchData(); setOpen(false); setForm({}) }
        else toast.error('Failed to update')
      } else {
        const res = await fetch('/api/fleet/insurance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        if (res.ok) { toast.success('Policy created'); fetchData(); setOpen(false); setForm({}) } else toast.error('Failed')
      }
    } catch (e) { toast.error('Failed') }
  }

  const handleEdit = (policy: any) => {
    setForm({
      id: policy.id,
      vehicleId: policy.vehicleId,
      policyNumber: policy.policyNumber,
      provider: policy.provider,
      type: policy.type,
      premium: policy.premium,
      startDate: policy.startDate ? new Date(policy.startDate).toISOString().split('T')[0] : '',
      endDate: policy.endDate ? new Date(policy.endDate).toISOString().split('T')[0] : '',
      coverage: policy.coverage || '',
      deductible: policy.deductible || 0,
      notes: policy.notes || '',
    })
    setEditMode(true)
    setOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/fleet/insurance?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Policy deleted'); fetchData() }
      else toast.error('Failed to delete')
    } catch (e) { toast.error('Delete failed') } finally { setDeleteOpen(false); setDeleteId(null) }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/fleet/insurance', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      if (res.ok) {
        toast.success(`Policy marked as ${status}`)
        fetchData()
      } else toast.error('Failed to update status')
    } catch (e) { toast.error('Status update failed') }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`
  const now = new Date()
  const thirtyDays = 30 * 86400000
  const expiringPolicies = policies.filter(p => new Date(p.endDate) < new Date(now.getTime() + thirtyDays) && p.status === 'active')
  const expiredPolicies = policies.filter(p => new Date(p.endDate) < now && p.status === 'active')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Insurance</h2><p className="text-sm text-muted-foreground">Manage insurance policies for your fleet</p></div>
        <Button onClick={() => { setForm({ type: 'comprehensive', premium: 0, status: 'active', deductible: 0, startDate: new Date().toISOString().split('T')[0], endDate: '' }); setEditMode(false); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />Add Policy</Button>
      </div>

      {expiringPolicies.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-base text-amber-700 dark:text-amber-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Expiring Soon</CardTitle></CardHeader>
          <CardContent><div className="space-y-1">{expiringPolicies.map(p => (
            <div key={p.id} className="text-xs flex items-center gap-2">
              <span className="font-medium">{p.vehicle ? `${p.vehicle.make} ${p.vehicle.model}` : 'N/A'}</span>
              <span className="text-muted-foreground">{p.policyNumber} — expires {new Date(p.endDate).toLocaleDateString()}</span>
              <Button variant="outline" size="sm" className="h-6 text-[10px] ml-2" onClick={() => handleStatusChange(p.id, 'expired')}>Mark Expired</Button>
            </div>
          ))}</div></CardContent>
        </Card>
      )}

      {expiredPolicies.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-base text-red-700 dark:text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Already Expired</CardTitle></CardHeader>
          <CardContent><div className="flex flex-wrap gap-2">{expiredPolicies.map(p => (
            <Badge key={p.id} variant="destructive" className="text-[10px]">{p.policyNumber} — {p.vehicle ? `${p.vehicle.make} ${p.vehicle.model}` : 'N/A'}</Badge>
          ))}</div></CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Policies', value: policies.length },
          { label: 'Active', value: policies.filter(p => p.status === 'active').length },
          { label: 'Expiring Soon', value: expiringPolicies.length },
          { label: 'Total Premiums', value: fmt(policies.filter(p => p.status === 'active').reduce((s, p) => s + (p.premium || 0), 0)) },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Vehicle</TableHead><TableHead className="text-xs">Policy #</TableHead><TableHead className="text-xs">Provider</TableHead>
            <TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Premium</TableHead><TableHead className="text-xs">Expiry</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs w-28">Actions</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow> :
            policies.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No insurance policies</TableCell></TableRow> :
            policies.map(p => (
              <TableRow key={p.id} className={p.status === 'expired' ? 'bg-red-50/50 dark:bg-red-950/10' : new Date(p.endDate) < new Date(now.getTime() + thirtyDays) && p.status === 'active' ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}>
                <TableCell className="text-xs font-medium">{p.vehicle ? `${p.vehicle.make} ${p.vehicle.model}` : 'N/A'}</TableCell>
                <TableCell className="text-xs font-mono">{p.policyNumber}</TableCell>
                <TableCell className="text-xs">{p.provider}</TableCell>
                <TableCell className="text-xs capitalize">{p.type}</TableCell>
                <TableCell className="text-xs font-medium">{fmt(p.premium)}</TableCell>
                <TableCell className="text-xs">{new Date(p.endDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge className={`text-[10px] ${p.status === 'active' ? 'bg-emerald-100 text-emerald-800' : p.status === 'expired' ? 'bg-red-100 text-red-800' : p.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : 'bg-amber-100 text-amber-800'}`}>{p.status}</Badge>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="flex items-center gap-1">
                    {p.status === 'active' && (
                      <>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-amber-600" onClick={() => handleStatusChange(p.id, 'expired')}>Expire</Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-red-600" onClick={() => handleStatusChange(p.id, 'cancelled')}>Cancel</Button>
                      </>
                    )}
                    {p.status === 'active' && (
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] text-blue-600" onClick={() => handleStatusChange(p.id, 'claimed')}>Claim</Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(p)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setDeleteId(p.id); setDeleteOpen(true) }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit Insurance Policy' : 'Add Insurance Policy'}</DialogTitle>
            <DialogDescription>{editMode ? 'Update the insurance policy details below.' : 'Fill in the details to add a new insurance policy.'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div><Label className="text-xs">Vehicle <span className="text-destructive">*</span></Label><Select value={form.vehicleId || ''} onValueChange={v => setForm({...form, vehicleId: v})} required><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger><SelectContent>{vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.make} {v.model}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Policy Number <span className="text-destructive">*</span></Label><Input value={form.policyNumber || ''} onChange={e => setForm({...form, policyNumber: e.target.value})} className="h-10 mt-1" placeholder="e.g. POL-2024-001" required /></div>
            <div><Label className="text-xs">Provider <span className="text-destructive">*</span></Label><Input value={form.provider || ''} onChange={e => setForm({...form, provider: e.target.value})} className="h-10 mt-1" placeholder="e.g. Allianz, AIG" required /></div>
            <div><Label className="text-xs">Type <span className="text-destructive">*</span></Label><Select value={form.type || 'comprehensive'} onValueChange={v => setForm({...form, type: v})} required><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="liability">Liability</SelectItem><SelectItem value="comprehensive">Comprehensive</SelectItem><SelectItem value="collision">Collision</SelectItem><SelectItem value="personal_injury">Personal Injury</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Start Date <span className="text-destructive">*</span></Label><Input type="date" value={form.startDate || ''} onChange={e => setForm({...form, startDate: e.target.value})} className="h-10 mt-1" required /></div>
            <div><Label className="text-xs">End Date <span className="text-destructive">*</span></Label><Input type="date" value={form.endDate || ''} onChange={e => setForm({...form, endDate: e.target.value})} className="h-10 mt-1" required /></div>
            <div><Label className="text-xs">Premium ($) <span className="text-destructive">*</span></Label><Input type="number" value={form.premium || ''} onChange={e => setForm({...form, premium: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="0.00" required /></div>
            <div><Label className="text-xs">Deductible ($)</Label><Input type="number" value={form.deductible || ''} onChange={e => setForm({...form, deductible: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="0.00" /></div>
            <div className="col-span-1 md:col-span-2"><Label className="text-xs">Coverage</Label><Input value={form.coverage || ''} onChange={e => setForm({...form, coverage: e.target.value})} className="h-10 mt-1" placeholder="e.g. Full coverage, Third party only" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>{editMode ? 'Update' : 'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Insurance Policy</DialogTitle><DialogDescription>This action cannot be undone.</DialogDescription></DialogHeader>
          <p className="text-sm text-muted-foreground py-4">Are you sure you want to delete this insurance policy? This action cannot be undone.</p>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
