'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Package, Plus, Pencil, Trash2, ArrowUpDown, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function SparePartsPage() {
  const [parts, setParts] = useState<any[]>([])
  const [lowStock, setLowStock] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<any>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustPart, setAdjustPart] = useState<any>(null)
  const [adjustForm, setAdjustForm] = useState({ type: 'increase', quantity: 0, reason: '' })

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try { const res = await fetch('/api/fleet/parts'); if (res.ok) { const j = await res.json(); setParts(j.data?.parts || []); setLowStock(j.data?.lowStock || []) } } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    try {
      if (editMode && form.id) {
        const res = await fetch('/api/fleet/parts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        if (res.ok) { toast.success('Part updated'); fetchData(); setOpen(false); setForm({}) }
        else toast.error('Failed to update')
      } else {
        const res = await fetch('/api/fleet/parts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
        if (res.ok) { toast.success('Part added'); fetchData(); setOpen(false); setForm({}) }
        else toast.error('Failed')
      }
    } catch (e) { toast.error('Failed') }
  }

  const handleEdit = (part: any) => {
    setForm({
      id: part.id,
      partNumber: part.partNumber || '',
      name: part.name,
      category: part.category || '',
      supplier: part.supplier || '',
      quantityInStock: part.quantityInStock,
      reorderLevel: part.reorderLevel,
      unitCost: part.unitCost,
      sellingPrice: part.sellingPrice || 0,
      location: part.location || '',
    })
    setEditMode(true)
    setOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/fleet/parts?id=${deleteId}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Part deleted'); fetchData() }
      else toast.error('Failed to delete')
    } catch (e) { toast.error('Delete failed') } finally { setDeleteOpen(false); setDeleteId(null) }
  }

  const handleAdjustStock = async () => {
    if (!adjustPart) return
    const qty = adjustForm.type === 'increase'
      ? adjustPart.quantityInStock + adjustForm.quantity
      : adjustPart.quantityInStock - adjustForm.quantity
    if (qty < 0) { toast.error('Stock cannot be negative'); return }
    try {
      const res = await fetch('/api/fleet/parts', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: adjustPart.id, quantityInStock: qty })
      })
      if (res.ok) {
        toast.success(`Stock ${adjustForm.type === 'increase' ? 'increased' : 'decreased'} by ${adjustForm.quantity}`)
        fetchData()
        setAdjustOpen(false)
        setAdjustPart(null)
        setAdjustForm({ type: 'increase', quantity: 0, reason: '' })
      } else toast.error('Failed to adjust stock')
    } catch (e) { toast.error('Adjustment failed') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Spare Parts</h2><p className="text-sm text-muted-foreground">Manage parts, categories, suppliers, and stock levels</p></div>
        <Button onClick={() => { setForm({ partNumber: '', name: '', quantityInStock: 0, reorderLevel: 5, unitCost: 0, sellingPrice: 0, category: '', supplier: '', location: '' }); setEditMode(false); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />Add Part</Button>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-base text-red-700 dark:text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Low Stock Alert</CardTitle></CardHeader>
          <CardContent><div className="flex flex-wrap gap-2">{lowStock.map(p => (
            <Badge key={p.id} variant="destructive" className="text-[10px]">{p.name}: {p.quantityInStock} left</Badge>
          ))}</div></CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Parts', value: parts.length },
          { label: 'Low Stock', value: lowStock.length },
          { label: 'Total Value', value: `$${parts.reduce((s, p) => s + (p.quantityInStock || 0) * (p.unitCost || 0), 0).toLocaleString()}` },
          { label: 'Categories', value: new Set(parts.map(p => p.category).filter(Boolean)).size },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Part #</TableHead><TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Category</TableHead>
            <TableHead className="text-xs">In Stock</TableHead><TableHead className="text-xs">Reorder Level</TableHead><TableHead className="text-xs">Unit Cost</TableHead><TableHead className="text-xs">Supplier</TableHead><TableHead className="text-xs w-28">Actions</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow> :
            parts.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No spare parts in inventory</TableCell></TableRow> :
            parts.map(p => (
              <TableRow key={p.id} className={p.quantityInStock <= p.reorderLevel ? 'bg-red-50/50 dark:bg-red-950/10' : ''}>
                <TableCell className="text-xs font-mono">{p.partNumber}</TableCell>
                <TableCell className="text-xs font-medium">{p.name}</TableCell>
                <TableCell className="text-xs">{p.category || 'N/A'}</TableCell>
                <TableCell className="text-xs">
                  <Badge variant={p.quantityInStock <= p.reorderLevel ? 'destructive' : 'outline'} className="text-[10px]">
                    {p.quantityInStock <= p.reorderLevel && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {p.quantityInStock}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{p.reorderLevel}</TableCell>
                <TableCell className="text-xs">${p.unitCost}</TableCell>
                <TableCell className="text-xs">{p.supplier || 'N/A'}</TableCell>
                <TableCell className="text-xs">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setAdjustPart(p); setAdjustForm({ type: 'increase', quantity: 0, reason: '' }); setAdjustOpen(true) }} title="Adjust Stock"><ArrowUpDown className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(p)} title="Edit"><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setDeleteId(p.id); setDeleteOpen(true) }} title="Delete"><Trash2 className="h-3 w-3" /></Button>
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
            <DialogTitle>{editMode ? 'Edit Spare Part' : 'Add Spare Part'}</DialogTitle>
            <DialogDescription>{editMode ? 'Update the spare part details below.' : 'Enter the details for the new spare part.'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div><Label className="text-xs">Part Number <span className="text-destructive">*</span></Label><Input value={form.partNumber || ''} onChange={e => setForm({...form, partNumber: e.target.value})} className="h-10 mt-1" placeholder="e.g. BRK-001" required /></div>
            <div><Label className="text-xs">Name <span className="text-destructive">*</span></Label><Input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="h-10 mt-1" placeholder="e.g. Brake Pad Set" required /></div>
            <div><Label className="text-xs">Category</Label><Input value={form.category || ''} onChange={e => setForm({...form, category: e.target.value})} className="h-10 mt-1" placeholder="e.g. Brakes, Engine, Electrical" /></div>
            <div><Label className="text-xs">Supplier</Label><Input value={form.supplier || ''} onChange={e => setForm({...form, supplier: e.target.value})} className="h-10 mt-1" placeholder="e.g. AutoParts Co." /></div>
            <div><Label className="text-xs">Quantity <span className="text-destructive">*</span></Label><Input type="number" value={form.quantityInStock ?? ''} onChange={e => setForm({...form, quantityInStock: parseInt(e.target.value) || 0})} className="h-10 mt-1" placeholder="0" required /></div>
            <div><Label className="text-xs">Reorder Level</Label><Input type="number" value={form.reorderLevel ?? ''} onChange={e => setForm({...form, reorderLevel: parseInt(e.target.value) || 0})} className="h-10 mt-1" placeholder="5" /></div>
            <div><Label className="text-xs">Unit Cost ($) <span className="text-destructive">*</span></Label><Input type="number" value={form.unitCost ?? ''} onChange={e => setForm({...form, unitCost: parseFloat(e.target.value) || 0})} className="h-10 mt-1" placeholder="0.00" required /></div>
            <div><Label className="text-xs">Selling Price ($)</Label><Input type="number" value={form.sellingPrice ?? ''} onChange={e => setForm({...form, sellingPrice: parseFloat(e.target.value) || 0})} className="h-10 mt-1" placeholder="0.00" /></div>
            <div className="col-span-1 md:col-span-2"><Label className="text-xs">Location</Label><Input value={form.location || ''} onChange={e => setForm({...form, location: e.target.value})} className="h-10 mt-1" placeholder="e.g. Warehouse A, Shelf 3" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>{editMode ? 'Update' : 'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adjust Stock — {adjustPart?.name}</DialogTitle>
            <DialogDescription>Increase or decrease the stock level for this part.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="col-span-1 md:col-span-2 flex items-center gap-2 text-sm p-3 rounded-lg bg-muted"><span className="text-muted-foreground">Current Stock:</span><span className="font-bold">{adjustPart?.quantityInStock}</span></div>
            <div><Label className="text-xs">Adjustment Type</Label>
              <Select value={adjustForm.type} onValueChange={v => setAdjustForm({...adjustForm, type: v})}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent><SelectItem value="increase">Increase (+)</SelectItem><SelectItem value="decrease">Decrease (-)</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Quantity <span className="text-destructive">*</span></Label><Input type="number" min={1} value={adjustForm.quantity || ''} onChange={e => setAdjustForm({...adjustForm, quantity: parseInt(e.target.value) || 0})} className="h-10 mt-1" placeholder="Enter quantity" required /></div>
            <div className="col-span-1 md:col-span-2"><Label className="text-xs">Reason</Label><Textarea value={adjustForm.reason} onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})} className="mt-1 min-h-[80px]" rows={2} placeholder="e.g. New delivery, Damaged, Used in repair..." /></div>
            {adjustForm.quantity > 0 && (
              <div className="col-span-1 md:col-span-2 text-sm p-3 rounded-lg bg-muted">
                New stock level: <span className="font-bold">{adjustForm.type === 'increase' ? (adjustPart?.quantityInStock || 0) + adjustForm.quantity : (adjustPart?.quantityInStock || 0) - adjustForm.quantity}</span>
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button><Button onClick={handleAdjustStock}>Apply Adjustment</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Delete Spare Part</DialogTitle><DialogDescription>This action cannot be undone.</DialogDescription></DialogHeader>
          <p className="text-sm text-muted-foreground py-4">Are you sure you want to delete this spare part? This action cannot be undone.</p>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
