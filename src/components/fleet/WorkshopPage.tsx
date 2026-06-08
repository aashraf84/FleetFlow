'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Cog, Plus, Pencil, Trash2, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  open: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-100 text-gray-800',
}

const priorityColors: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

export default function WorkshopPage() {
  const [jobCards, setJobCards] = useState<any[]>([])
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<any>(null)
  const [createForm, setCreateForm] = useState<any>({ maintenanceId: '', technician: '', estimatedHours: '', notes: '' })
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [workRes, maintRes] = await Promise.all([
        fetch('/api/fleet/workshop'),
        fetch('/api/fleet/maintenance?status=scheduled,in_progress')
      ])
      if (workRes.ok) { const j = await workRes.json(); setJobCards(j.data || []) }
      if (maintRes.ok) { const j = await maintRes.json(); setMaintenanceRecords(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const fmt = (n: number) => `$${(n || 0).toLocaleString()}`

  // Maintenance records that don't already have a job card
  const availableMaintenance = maintenanceRecords.filter(
    (m: any) => !jobCards.some((jc: any) => jc.maintenanceId === m.id)
  )

  const handleCreate = async () => {
    if (!createForm.maintenanceId) {
      toast.error('Please select a maintenance record')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/fleet/workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      })
      if (res.ok) {
        toast.success('Job card created')
        fetchData()
        setCreateOpen(false)
        setCreateForm({ maintenanceId: '', technician: '', estimatedHours: '', notes: '' })
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create job card')
      }
    } catch (e) { toast.error('Request failed') } finally { setSaving(false) }
  }

  const handleEdit = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/fleet/workshop', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editForm.id, ...editForm })
      })
      if (res.ok) {
        toast.success('Job card updated')
        fetchData()
        setEditOpen(false)
        setEditForm({})
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to update')
      }
    } catch (e) { toast.error('Request failed') } finally { setSaving(false) }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/fleet/workshop', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      })
      if (res.ok) {
        toast.success(`Job card ${newStatus.replace('_', ' ')}`)
        fetchData()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to update status')
      }
    } catch (e) { toast.error('Request failed') }
  }

  const handleDelete = async () => {
    if (!selectedCard) return
    try {
      const res = await fetch(`/api/fleet/workshop?id=${selectedCard.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Job card deleted')
        fetchData()
        setDeleteOpen(false)
        setSelectedCard(null)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to delete')
      }
    } catch (e) { toast.error('Request failed') }
  }

  const openEditDialog = (jc: any) => {
    setEditForm({
      id: jc.id,
      technician: jc.technician || '',
      estimatedHours: jc.estimatedHours || 0,
      actualHours: jc.actualHours || 0,
      laborCost: jc.laborCost || 0,
      partsCost: jc.partsCost || 0,
      notes: jc.notes || '',
    })
    setEditOpen(true)
  }

  const totalLaborCost = jobCards.reduce((s: number, j: any) => s + (j.laborCost || 0), 0)
  const totalPartsCost = jobCards.reduce((s: number, j: any) => s + (j.partsCost || 0), 0)
  const totalAllCost = jobCards.reduce((s: number, j: any) => s + (j.totalCost || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workshop Management</h2>
          <p className="text-sm text-muted-foreground">Job cards, mechanics, repair orders, and labor costs</p>
        </div>
        <Button onClick={() => { setCreateForm({ maintenanceId: '', technician: '', estimatedHours: '', notes: '' }); setCreateOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />Create Job Card
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Job Cards', value: jobCards.length },
          { label: 'Open', value: jobCards.filter((j: any) => j.status === 'open').length },
          { label: 'In Progress', value: jobCards.filter((j: any) => j.status === 'in_progress').length },
          { label: 'Labor Cost', value: fmt(totalLaborCost) },
          { label: 'Total Cost', value: fmt(totalAllCost) },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-xl font-bold">{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Cost Breakdown */}
      {jobCards.length > 0 && (
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-2">Cost Breakdown</p>
          <div className="flex gap-6">
            <div><span className="text-xs text-muted-foreground">Labor:</span> <span className="font-semibold">{fmt(totalLaborCost)}</span></div>
            <div><span className="text-xs text-muted-foreground">Parts:</span> <span className="font-semibold">{fmt(totalPartsCost)}</span></div>
            <div><span className="text-xs text-muted-foreground">Total:</span> <span className="font-bold text-lg">{fmt(totalAllCost)}</span></div>
          </div>
        </CardContent></Card>
      )}

      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Vehicle</TableHead>
              <TableHead className="text-xs">Maint. Type</TableHead>
              <TableHead className="text-xs">Technician</TableHead>
              <TableHead className="text-xs">Est. Hours</TableHead>
              <TableHead className="text-xs">Actual Hours</TableHead>
              <TableHead className="text-xs">Labor Cost</TableHead>
              <TableHead className="text-xs">Parts Cost</TableHead>
              <TableHead className="text-xs">Total Cost</TableHead>
              <TableHead className="text-xs">Priority</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={11} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : jobCards.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="text-center py-8 text-muted-foreground">No job cards found. Create a job card from a maintenance record.</TableCell></TableRow>
              ) : (
                jobCards.map((jc: any) => (
                  <TableRow key={jc.id}>
                    <TableCell className="text-xs font-medium">
                      {jc.maintenance?.vehicle ? `${jc.maintenance.vehicle.make} ${jc.maintenance.vehicle.model}` : 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs capitalize">{jc.maintenance?.type?.replace('_', ' ') || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{jc.technician || 'Unassigned'}</TableCell>
                    <TableCell className="text-xs">{jc.estimatedHours}h</TableCell>
                    <TableCell className="text-xs">{jc.actualHours}h</TableCell>
                    <TableCell className="text-xs font-medium">{fmt(jc.laborCost)}</TableCell>
                    <TableCell className="text-xs font-medium">{fmt(jc.partsCost)}</TableCell>
                    <TableCell className="text-xs font-bold">{fmt(jc.totalCost)}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${priorityColors[jc.maintenance?.priority] || ''}`} variant={jc.maintenance?.priority === 'urgent' ? 'destructive' : 'outline'}>
                        {jc.maintenance?.priority || 'normal'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${statusColors[jc.status] || ''}`}>
                        {jc.status?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditDialog(jc)} title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {jc.status === 'open' && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-600" onClick={() => handleStatusChange(jc.id, 'in_progress')} title="Start">
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {jc.status === 'in_progress' && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-600" onClick={() => handleStatusChange(jc.id, 'completed')} title="Complete">
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {jc.status === 'completed' && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-600" onClick={() => handleStatusChange(jc.id, 'closed')} title="Close">
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {jc.status === 'open' && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={() => { setSelectedCard(jc); setDeleteOpen(true) }} title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent></Card>

      {/* Create Job Card Dialog */}
      <Dialog open={createOpen} onOpenChange={(v) => { if (!saving) setCreateOpen(v) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Job Card</DialogTitle>
            <DialogDescription>Create a new job card from an existing maintenance record.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="col-span-1 md:col-span-2">
              <Label className="text-xs">Maintenance Record <span className="text-destructive">*</span></Label>
              <Select value={createForm.maintenanceId || ''} onValueChange={v => setCreateForm({ ...createForm, maintenanceId: v })} required>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select maintenance record" /></SelectTrigger>
                <SelectContent>
                  {availableMaintenance.length === 0 ? (
                    <SelectItem value="_none" disabled>No available maintenance records</SelectItem>
                  ) : (
                    availableMaintenance.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.vehicle ? `${m.vehicle.make} ${m.vehicle.model}` : 'Unknown'} — {m.type?.replace('_', ' ')} — {m.description?.substring(0, 40)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Technician Name <span className="text-destructive">*</span></Label>
              <Input value={createForm.technician || ''} onChange={e => setCreateForm({ ...createForm, technician: e.target.value })} className="h-10 mt-1" placeholder="Enter technician name" required />
            </div>
            <div>
              <Label className="text-xs">Estimated Hours</Label>
              <Input type="number" step="0.5" value={createForm.estimatedHours || ''} onChange={e => setCreateForm({ ...createForm, estimatedHours: e.target.value })} className="h-10 mt-1" placeholder="0" />
            </div>
            <div className="col-span-1 md:col-span-2">
              <Label className="text-xs">Notes</Label>
              <Textarea value={createForm.notes || ''} onChange={e => setCreateForm({ ...createForm, notes: e.target.value })} className="mt-1 min-h-[80px]" rows={3} placeholder="Optional notes about the job" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCreate(); }} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Job Card Dialog */}
      <Dialog open={editOpen} onOpenChange={(v) => { if (!saving) setEditOpen(v) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job Card</DialogTitle>
            <DialogDescription>Update the job card details, hours, and costs.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <Label className="text-xs">Technician</Label>
              <Input value={editForm.technician || ''} onChange={e => setEditForm({ ...editForm, technician: e.target.value })} className="h-10 mt-1" placeholder="Enter technician name" />
            </div>
            <div className="col-span-1 md:col-span-2"></div>
            <div>
              <Label className="text-xs">Estimated Hours</Label>
              <Input type="number" step="0.5" value={editForm.estimatedHours || 0} onChange={e => setEditForm({ ...editForm, estimatedHours: parseFloat(e.target.value) || 0 })} className="h-10 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Actual Hours</Label>
              <Input type="number" step="0.5" value={editForm.actualHours || 0} onChange={e => setEditForm({ ...editForm, actualHours: parseFloat(e.target.value) || 0 })} className="h-10 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Labor Cost ($)</Label>
              <Input type="number" step="0.01" value={editForm.laborCost || 0} onChange={e => setEditForm({ ...editForm, laborCost: parseFloat(e.target.value) || 0 })} className="h-10 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Parts Cost ($)</Label>
              <Input type="number" step="0.01" value={editForm.partsCost || 0} onChange={e => setEditForm({ ...editForm, partsCost: parseFloat(e.target.value) || 0 })} className="h-10 mt-1" />
            </div>
            <div className="col-span-1 md:col-span-2 p-3 bg-muted rounded-md">
              <span className="text-xs text-muted-foreground">Total Cost: </span>
              <span className="font-bold">${((editForm.laborCost || 0) + (editForm.partsCost || 0)).toLocaleString()}</span>
            </div>
            <div className="col-span-1 md:col-span-2">
              <Label className="text-xs">Notes</Label>
              <Textarea value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className="mt-1 min-h-[80px]" rows={3} placeholder="Additional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(); }} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Job Card</DialogTitle>
            <DialogDescription>This action cannot be undone. Only open job cards can be deleted.</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Are you sure you want to delete this job card? Only open job cards can be deleted. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
