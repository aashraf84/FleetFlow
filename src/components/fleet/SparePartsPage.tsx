'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Package, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function SparePartsPage() {
  const [parts, setParts] = useState<any[]>([])
  const [lowStock, setLowStock] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try { const res = await fetch('/api/fleet/parts'); if (res.ok) { const j = await res.json(); setParts(j.data?.parts || []); setLowStock(j.data?.lowStock || []) } } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/fleet/parts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { toast.success('Part added'); fetchData(); setOpen(false); setForm({}) }
      else toast.error('Failed')
    } catch (e) { toast.error('Failed') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Spare Parts</h2><p className="text-sm text-muted-foreground">Manage parts, categories, suppliers, and stock levels</p></div>
        <Button onClick={() => { setForm({ partNumber: '', name: '', quantityInStock: 0, reorderLevel: 5, unitCost: 0, sellingPrice: 0 }); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />Add Part</Button>
      </div>
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
            <TableHead className="text-xs">In Stock</TableHead><TableHead className="text-xs">Reorder Level</TableHead><TableHead className="text-xs">Unit Cost</TableHead><TableHead className="text-xs">Supplier</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
            parts.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No spare parts in inventory</TableCell></TableRow> :
            parts.map(p => (
              <TableRow key={p.id}>
                <TableCell className="text-xs font-mono">{p.partNumber}</TableCell>
                <TableCell className="text-xs font-medium">{p.name}</TableCell>
                <TableCell className="text-xs">{p.category || 'N/A'}</TableCell>
                <TableCell className="text-xs"><Badge variant={p.quantityInStock <= p.reorderLevel ? 'destructive' : 'outline'} className="text-[10px]">{p.quantityInStock}</Badge></TableCell>
                <TableCell className="text-xs">{p.reorderLevel}</TableCell>
                <TableCell className="text-xs">${p.unitCost}</TableCell>
                <TableCell className="text-xs">{p.supplier || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Spare Part</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label className="text-xs">Part Number</Label><Input value={form.partNumber || ''} onChange={e => setForm({...form, partNumber: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Name</Label><Input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="h-9 mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Category</Label><Input value={form.category || ''} onChange={e => setForm({...form, category: e.target.value})} className="h-9 mt-1" /></div>
              <div><Label className="text-xs">Supplier</Label><Input value={form.supplier || ''} onChange={e => setForm({...form, supplier: e.target.value})} className="h-9 mt-1" /></div>
              <div><Label className="text-xs">Quantity</Label><Input type="number" value={form.quantityInStock || ''} onChange={e => setForm({...form, quantityInStock: parseInt(e.target.value)})} className="h-9 mt-1" /></div>
              <div><Label className="text-xs">Reorder Level</Label><Input type="number" value={form.reorderLevel || ''} onChange={e => setForm({...form, reorderLevel: parseInt(e.target.value)})} className="h-9 mt-1" /></div>
              <div><Label className="text-xs">Unit Cost ($)</Label><Input type="number" value={form.unitCost || ''} onChange={e => setForm({...form, unitCost: parseFloat(e.target.value)})} className="h-9 mt-1" /></div>
              <div><Label className="text-xs">Selling Price ($)</Label><Input type="number" value={form.sellingPrice || ''} onChange={e => setForm({...form, sellingPrice: parseFloat(e.target.value)})} className="h-9 mt-1" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
