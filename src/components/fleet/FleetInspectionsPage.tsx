'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ClipboardCheck, Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  passed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
  conditional: 'bg-amber-100 text-amber-800',
  pending: 'bg-gray-100 text-gray-800',
}

const conditionColors: Record<string, string> = {
  excellent: 'bg-emerald-100 text-emerald-700',
  good: 'bg-blue-100 text-blue-700',
  fair: 'bg-amber-100 text-amber-700',
  poor: 'bg-red-100 text-red-700',
}

const defaultCreateForm = {
  vehicleId: '',
  inspector: '',
  type: 'routine',
  overallCondition: 'good',
  exteriorCondition: '',
  interiorCondition: '',
  engineCondition: '',
  tireCondition: '',
  brakesCondition: '',
  notes: '',
  issues: '',
  status: 'pending',
  inspectionDate: '',
  nextInspectionDate: '',
}

export default function FleetInspectionsPage() {
  const [inspections, setInspections] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [createForm, setCreateForm] = useState<any>({ ...defaultCreateForm })
  const [editForm, setEditForm] = useState<any>({})
  const [selectedInspection, setSelectedInspection] = useState<any>(null)

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

  const handleCreate = async () => {
    if (!createForm.vehicleId) {
      toast.error('Please select a vehicle')
      return
    }
    try {
      const res = await fetch('/api/fleet/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      })
      if (res.ok) {
        toast.success('Inspection created')
        fetchData()
        setCreateOpen(false)
        setCreateForm({ ...defaultCreateForm })
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create')
      }
    } catch (e) { toast.error('Request failed') }
  }

  const handleEdit = async () => {
    try {
      const res = await fetch('/api/fleet/inspections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      if (res.ok) {
        toast.success('Inspection updated')
        fetchData()
        setEditOpen(false)
        setEditForm({})
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to update')
      }
    } catch (e) { toast.error('Request failed') }
  }

  const handleDelete = async () => {
    if (!selectedInspection) return
    try {
      const res = await fetch(`/api/fleet/inspections?id=${selectedInspection.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Inspection deleted')
        fetchData()
        setDeleteOpen(false)
        setSelectedInspection(null)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to delete')
      }
    } catch (e) { toast.error('Request failed') }
  }

  const openEditDialog = (insp: any) => {
    setEditForm({
      id: insp.id,
      inspector: insp.inspector || '',
      type: insp.type || 'routine',
      overallCondition: insp.overallCondition || 'good',
      exteriorCondition: insp.exteriorCondition || '',
      interiorCondition: insp.interiorCondition || '',
      engineCondition: insp.engineCondition || '',
      tireCondition: insp.tireCondition || '',
      brakesCondition: insp.brakesCondition || '',
      notes: insp.notes || '',
      issues: insp.issues || '',
      status: insp.status || 'pending',
      nextInspectionDate: insp.nextInspectionDate ? new Date(insp.nextInspectionDate).toISOString().split('T')[0] : '',
    })
    setEditOpen(true)
  }

  const ConditionSelect = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={value || 'good'} onValueChange={onChange}>
        <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="excellent">Excellent</SelectItem>
          <SelectItem value="good">Good</SelectItem>
          <SelectItem value="fair">Fair</SelectItem>
          <SelectItem value="poor">Poor</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  const ConditionBadge = ({ value }: { value: string | null | undefined }) => {
    if (!value) return <span className="text-xs text-muted-foreground">N/A</span>
    return <Badge className={`text-[10px] ${conditionColors[value] || ''}`}>{value}</Badge>
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
        <div>
          <h2 className="text-2xl font-bold">Inspections</h2>
          <p className="text-sm text-muted-foreground">Vehicle inspection records</p>
        </div>
        <Button onClick={() => { setCreateForm({ ...defaultCreateForm }); setCreateOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />New Inspection
        </Button>
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
                <TableHead className="text-xs">Overall</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Issues</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : inspections.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No inspections recorded</TableCell></TableRow>
                ) : (
                  inspections.map(i => (
                    <TableRow key={i.id}>
                      <TableCell className="text-xs font-medium">{i.vehicle ? `${i.vehicle.make} ${i.vehicle.model}` : 'N/A'}</TableCell>
                      <TableCell className="text-xs">{i.inspector || 'N/A'}</TableCell>
                      <TableCell className="text-xs capitalize">{i.type?.replace('_', ' ')}</TableCell>
                      <TableCell className="text-xs">{i.inspectionDate ? new Date(i.inspectionDate).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell><ConditionBadge value={i.overallCondition} /></TableCell>
                      <TableCell><Badge variant={i.status === 'passed' ? 'default' : i.status === 'failed' ? 'destructive' : 'outline'} className={`text-[10px] ${statusColors[i.status] || ''}`}>{i.status}</Badge></TableCell>
                      <TableCell className="text-xs max-w-32 truncate">{i.issues || i.notes || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setSelectedInspection(i); setViewOpen(true) }} title="View Details">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditDialog(i)} title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={() => { setSelectedInspection(i); setDeleteOpen(true) }} title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Create Inspection Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Inspection</DialogTitle><DialogDescription>Create a new vehicle inspection record with condition assessments.</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="col-span-1 md:col-span-2">
              <Label>Vehicle *</Label>
              <Select value={createForm.vehicleId || ''} onValueChange={v => setCreateForm({ ...createForm, vehicleId: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select vehicle for inspection" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v: any) => <SelectItem key={v.id} value={v.id}>{v.make} {v.model} ({v.vehicleNumber})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Inspector Name *</Label>
              <Input value={createForm.inspector || ''} onChange={e => setCreateForm({ ...createForm, inspector: e.target.value })} className="h-10 mt-1" placeholder="Enter inspector name" required />
            </div>
            <div>
              <Label>Inspection Date</Label>
              <Input type="date" value={createForm.inspectionDate || ''} onChange={e => setCreateForm({ ...createForm, inspectionDate: e.target.value })} className="h-10 mt-1" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={createForm.type || 'routine'} onValueChange={v => setCreateForm({ ...createForm, type: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select inspection type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="pre_rental">Pre-Rental</SelectItem>
                  <SelectItem value="post_rental">Post-Rental</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Overall Condition</Label>
              <Select value={createForm.overallCondition || 'good'} onValueChange={v => setCreateForm({ ...createForm, overallCondition: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Exterior Condition</Label>
              <Select value={createForm.exteriorCondition || 'good'} onValueChange={v => setCreateForm({ ...createForm, exteriorCondition: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Interior Condition</Label>
              <Select value={createForm.interiorCondition || 'good'} onValueChange={v => setCreateForm({ ...createForm, interiorCondition: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Engine Condition</Label>
              <Select value={createForm.engineCondition || 'good'} onValueChange={v => setCreateForm({ ...createForm, engineCondition: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tire Condition</Label>
              <Select value={createForm.tireCondition || 'good'} onValueChange={v => setCreateForm({ ...createForm, tireCondition: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Brake Condition</Label>
              <Select value={createForm.brakesCondition || 'good'} onValueChange={v => setCreateForm({ ...createForm, brakesCondition: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <Label>Issues Found</Label>
              <Textarea value={createForm.issues || ''} onChange={e => setCreateForm({ ...createForm, issues: e.target.value })} className="mt-1 min-h-[80px]" rows={3} placeholder="Describe any issues found during inspection" />
            </div>
            <div className="col-span-1 md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={createForm.notes || ''} onChange={e => setCreateForm({ ...createForm, notes: e.target.value })} className="mt-1 min-h-[80px]" rows={3} placeholder="Additional notes or observations" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={createForm.status || 'pending'} onValueChange={v => setCreateForm({ ...createForm, status: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="conditional">Conditional</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Next Inspection Date</Label>
              <Input type="date" value={createForm.nextInspectionDate || ''} onChange={e => setCreateForm({ ...createForm, nextInspectionDate: e.target.value })} className="h-10 mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Inspection Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Inspection</DialogTitle><DialogDescription>Update the inspection record details and condition assessments.</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <Label>Inspector Name *</Label>
              <Input value={editForm.inspector || ''} onChange={e => setEditForm({ ...editForm, inspector: e.target.value })} className="h-10 mt-1" placeholder="Enter inspector name" required />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={editForm.type || 'routine'} onValueChange={v => setEditForm({ ...editForm, type: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select inspection type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="pre_rental">Pre-Rental</SelectItem>
                  <SelectItem value="post_rental">Post-Rental</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Overall Condition</Label>
              <Select value={editForm.overallCondition || 'good'} onValueChange={v => setEditForm({ ...editForm, overallCondition: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Exterior Condition</Label>
              <Select value={editForm.exteriorCondition || 'good'} onValueChange={v => setEditForm({ ...editForm, exteriorCondition: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Interior Condition</Label>
              <Select value={editForm.interiorCondition || 'good'} onValueChange={v => setEditForm({ ...editForm, interiorCondition: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Engine Condition</Label>
              <Select value={editForm.engineCondition || 'good'} onValueChange={v => setEditForm({ ...editForm, engineCondition: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tire Condition</Label>
              <Select value={editForm.tireCondition || 'good'} onValueChange={v => setEditForm({ ...editForm, tireCondition: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Brake Condition</Label>
              <Select value={editForm.brakesCondition || 'good'} onValueChange={v => setEditForm({ ...editForm, brakesCondition: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editForm.status || 'pending'} onValueChange={v => setEditForm({ ...editForm, status: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="conditional">Conditional</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-1 md:col-span-2">
              <Label>Issues Found</Label>
              <Textarea value={editForm.issues || ''} onChange={e => setEditForm({ ...editForm, issues: e.target.value })} className="mt-1 min-h-[80px]" rows={3} placeholder="Describe any issues found during inspection" />
            </div>
            <div className="col-span-1 md:col-span-2">
              <Label>Notes</Label>
              <Textarea value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className="mt-1 min-h-[80px]" rows={3} placeholder="Additional notes or observations" />
            </div>
            <div>
              <Label>Next Inspection Date</Label>
              <Input type="date" value={editForm.nextInspectionDate || ''} onChange={e => setEditForm({ ...editForm, nextInspectionDate: e.target.value })} className="h-10 mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Inspection Details</DialogTitle><DialogDescription>View the full inspection record and condition assessments.</DialogDescription></DialogHeader>
          {selectedInspection && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Vehicle</p>
                  <p className="text-sm font-medium">{selectedInspection.vehicle ? `${selectedInspection.vehicle.make} ${selectedInspection.vehicle.model} (${selectedInspection.vehicle.vehicleNumber})` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Inspector</p>
                  <p className="text-sm font-medium">{selectedInspection.inspector || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm font-medium capitalize">{selectedInspection.type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium">{selectedInspection.inspectionDate ? new Date(selectedInspection.inspectionDate).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-semibold mb-2">Condition Assessment</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Overall', value: selectedInspection.overallCondition },
                    { label: 'Exterior', value: selectedInspection.exteriorCondition },
                    { label: 'Interior', value: selectedInspection.interiorCondition },
                    { label: 'Engine', value: selectedInspection.engineCondition },
                    { label: 'Tires', value: selectedInspection.tireCondition },
                    { label: 'Brakes', value: selectedInspection.brakesCondition },
                  ].map(c => (
                    <div key={c.label} className="text-center p-2 rounded-md bg-muted">
                      <p className="text-[10px] text-muted-foreground">{c.label}</p>
                      <ConditionBadge value={c.value} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs font-semibold">Status:</p>
                  <Badge variant={selectedInspection.status === 'passed' ? 'default' : selectedInspection.status === 'failed' ? 'destructive' : 'outline'} className={`text-[10px] ${statusColors[selectedInspection.status] || ''}`}>
                    {selectedInspection.status}
                  </Badge>
                </div>
              </div>

              {selectedInspection.issues && (
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold mb-1">Issues Found</p>
                  <p className="text-sm text-muted-foreground">{selectedInspection.issues}</p>
                </div>
              )}

              {selectedInspection.notes && (
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{selectedInspection.notes}</p>
                </div>
              )}

              {selectedInspection.nextInspectionDate && (
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground">Next Inspection Due</p>
                  <p className="text-sm font-medium">{new Date(selectedInspection.nextInspectionDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Inspection</DialogTitle><DialogDescription>This action cannot be undone.</DialogDescription></DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Are you sure you want to delete this inspection record? This action cannot be undone.
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
