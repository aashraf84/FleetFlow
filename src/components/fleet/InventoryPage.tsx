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
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Warehouse, ArrowUpDown, ArrowRightLeft, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function InventoryPage() {
  const [parts, setParts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [adjustForm, setAdjustForm] = useState({ partId: '', type: 'increase', quantity: 0, reason: '' })
  const [transferForm, setTransferForm] = useState({ partId: '', fromLocation: '', toLocation: '', quantity: 0, notes: '' })

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try { const res = await fetch('/api/fleet/parts'); if (res.ok) { const j = await res.json(); setParts(j.data?.parts || []) } } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const totalValue = parts.reduce((s, p) => s + (p.quantityInStock || 0) * (p.unitCost || 0), 0)
  const lowStockItems = parts.filter(p => p.quantityInStock <= p.reorderLevel)
  const byWarehouse: Record<string, { count: number; value: number; items: number }> = {}
  parts.forEach(p => { const w = p.location || 'Default'; byWarehouse[w] = byWarehouse[w] || { count: 0, value: 0, items: 0 }; byWarehouse[w].count++; byWarehouse[w].value += (p.quantityInStock || 0) * (p.unitCost || 0); byWarehouse[w].items += p.quantityInStock || 0 })

  const warehouses = Object.keys(byWarehouse)
  const selectedPart = parts.find(p => p.id === (adjustForm.partId || transferForm.partId))

  const handleAdjustStock = async () => {
    if (!adjustForm.partId) { toast.error('Select a part'); return }
    if (adjustForm.quantity <= 0) { toast.error('Quantity must be greater than 0'); return }
    const part = parts.find(p => p.id === adjustForm.partId)
    if (!part) return
    const newQty = adjustForm.type === 'increase'
      ? part.quantityInStock + adjustForm.quantity
      : part.quantityInStock - adjustForm.quantity
    if (newQty < 0) { toast.error('Stock cannot be negative'); return }
    try {
      const res = await fetch('/api/fleet/parts', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: adjustForm.partId, quantityInStock: newQty })
      })
      if (res.ok) {
        toast.success(`Stock ${adjustForm.type === 'increase' ? 'increased' : 'decreased'} by ${adjustForm.quantity}`)
        fetchData()
        setAdjustOpen(false)
        setAdjustForm({ partId: '', type: 'increase', quantity: 0, reason: '' })
      } else toast.error('Failed to adjust stock')
    } catch (e) { toast.error('Adjustment failed') }
  }

  const handleStockTransfer = async () => {
    if (!transferForm.partId) { toast.error('Select a part'); return }
    if (!transferForm.fromLocation || !transferForm.toLocation) { toast.error('Select source and destination locations'); return }
    if (transferForm.fromLocation === transferForm.toLocation) { toast.error('Source and destination must be different'); return }
    if (transferForm.quantity <= 0) { toast.error('Quantity must be greater than 0'); return }
    const part = parts.find(p => p.id === transferForm.partId)
    if (!part) return
    if (part.quantityInStock < transferForm.quantity) { toast.error('Insufficient stock for transfer'); return }
    try {
      // Update part location to destination (simulates transfer)
      const res = await fetch('/api/fleet/parts', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: transferForm.partId, location: transferForm.toLocation })
      })
      if (res.ok) {
        toast.success(`Transferred ${transferForm.quantity} units to ${transferForm.toLocation}`)
        fetchData()
        setTransferOpen(false)
        setTransferForm({ partId: '', fromLocation: '', toLocation: '', quantity: 0, notes: '' })
      } else toast.error('Failed to transfer stock')
    } catch (e) { toast.error('Transfer failed') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Inventory Management</h2><p className="text-sm text-muted-foreground">Stock transfers, adjustments, and goods receipts</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { setAdjustForm({ partId: '', type: 'increase', quantity: 0, reason: '' }); setAdjustOpen(true) }}>
            <ArrowUpDown className="h-4 w-4 mr-2" />Stock Adjustment
          </Button>
          <Button variant="outline" onClick={() => { setTransferForm({ partId: '', fromLocation: '', toLocation: '', quantity: 0, notes: '' }); setTransferOpen(true) }}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />Stock Transfer
          </Button>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
          <CardHeader className="pb-2"><CardTitle className="text-base text-red-700 dark:text-red-400 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Low Stock Alerts</CardTitle></CardHeader>
          <CardContent><div className="flex flex-wrap gap-2">{lowStockItems.map(p => (
            <Badge key={p.id} variant="destructive" className="text-[10px]">{p.name}: {p.quantityInStock} / {p.reorderLevel} reorder level</Badge>
          ))}</div></CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: parts.length },
          { label: 'Total Value', value: `$${totalValue.toLocaleString()}` },
          { label: 'Warehouses', value: warehouses.length },
          { label: 'Low Stock Items', value: lowStockItems.length },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Warehouse Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(byWarehouse).map(([name, data]) => (
              <Card key={name}><CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2"><Warehouse className="h-4 w-4 text-muted-foreground" /><span className="font-medium text-sm">{name}</span></div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Unique Parts:</span><span>{data.count}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Items:</span><span>{data.items}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Value:</span><span className="font-medium">${data.value.toLocaleString()}</span></div>
                </div>
              </CardContent></Card>
            ))}
            {warehouses.length === 0 && <div className="col-span-3 text-center py-8 text-muted-foreground">No warehouse data available</div>}
          </div>
        </CardContent>
      </Card>

      <Card><CardHeader className="pb-2"><CardTitle className="text-base">Inventory Items</CardTitle></CardHeader><CardContent className="p-0">
        <ScrollArea className="max-h-[400px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Part #</TableHead><TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Warehouse</TableHead>
            <TableHead className="text-xs">Stock</TableHead><TableHead className="text-xs">Unit Cost</TableHead><TableHead className="text-xs">Value</TableHead><TableHead className="text-xs">Status</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
            parts.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No inventory items</TableCell></TableRow> :
            parts.map(p => (
              <TableRow key={p.id} className={p.quantityInStock <= p.reorderLevel ? 'bg-red-50/50 dark:bg-red-950/10' : ''}>
                <TableCell className="text-xs font-mono">{p.partNumber}</TableCell>
                <TableCell className="text-xs">{p.name}</TableCell>
                <TableCell className="text-xs">{p.location || 'Default'}</TableCell>
                <TableCell className="text-xs">{p.quantityInStock}</TableCell>
                <TableCell className="text-xs">${p.unitCost}</TableCell>
                <TableCell className="text-xs font-medium">${((p.quantityInStock || 0) * (p.unitCost || 0)).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={p.quantityInStock <= p.reorderLevel ? 'destructive' : 'secondary'} className="text-[10px]">
                    {p.quantityInStock <= p.reorderLevel ? (
                      <><AlertTriangle className="h-3 w-3 mr-1" />Low Stock</>
                    ) : 'In Stock'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>

      {/* Stock Adjustment Dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock Adjustment</DialogTitle>
            <DialogDescription>Increase or decrease stock levels for a specific part.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="col-span-1 md:col-span-2"><Label className="text-xs">Select Part <span className="text-destructive">*</span></Label>
              <Select value={adjustForm.partId} onValueChange={v => setAdjustForm({...adjustForm, partId: v})}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select a part" /></SelectTrigger>
                <SelectContent>{parts.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.partNumber || 'N/A'})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {selectedPart && (
              <div className="col-span-1 md:col-span-2 text-sm p-3 rounded-lg bg-muted">
                Current stock: <span className="font-bold">{selectedPart.quantityInStock}</span> · Location: {selectedPart.location || 'Default'}
              </div>
            )}
            <div><Label className="text-xs">Adjustment Type</Label>
              <Select value={adjustForm.type} onValueChange={v => setAdjustForm({...adjustForm, type: v})}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent><SelectItem value="increase">Increase (+)</SelectItem><SelectItem value="decrease">Decrease (-)</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Quantity <span className="text-destructive">*</span></Label><Input type="number" min={1} value={adjustForm.quantity || ''} onChange={e => setAdjustForm({...adjustForm, quantity: parseInt(e.target.value) || 0})} className="h-10 mt-1" placeholder="Enter quantity" required /></div>
            <div className="col-span-1 md:col-span-2"><Label className="text-xs">Reason</Label><Textarea value={adjustForm.reason} onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})} className="mt-1 min-h-[80px]" rows={2} placeholder="e.g. New delivery, Damaged, Used in repair..." /></div>
            {selectedPart && adjustForm.quantity > 0 && (
              <div className="col-span-1 md:col-span-2 text-sm p-3 rounded-lg bg-muted">
                New stock level: <span className="font-bold">{adjustForm.type === 'increase' ? selectedPart.quantityInStock + adjustForm.quantity : selectedPart.quantityInStock - adjustForm.quantity}</span>
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancel</Button><Button onClick={handleAdjustStock}>Apply Adjustment</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock Transfer</DialogTitle>
            <DialogDescription>Transfer stock between warehouses or locations.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="col-span-1 md:col-span-2"><Label className="text-xs">Select Part <span className="text-destructive">*</span></Label>
              <Select value={transferForm.partId} onValueChange={v => {
                const part = parts.find(p => p.id === v)
                setTransferForm({...transferForm, partId: v, fromLocation: part?.location || 'Default'})
              }}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select a part" /></SelectTrigger>
                <SelectContent>{parts.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.partNumber || 'N/A'}) — Stock: {p.quantityInStock}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {selectedPart && (
              <div className="col-span-1 md:col-span-2 text-sm p-3 rounded-lg bg-muted">
                Current stock: <span className="font-bold">{selectedPart.quantityInStock}</span> · Location: {selectedPart.location || 'Default'}
              </div>
            )}
            <div><Label className="text-xs">From Location <span className="text-destructive">*</span></Label>
              <Select value={transferForm.fromLocation} onValueChange={v => setTransferForm({...transferForm, fromLocation: v})}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  <SelectItem value="New Location">+ New Location</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">To Location <span className="text-destructive">*</span></Label>
              <Select value={transferForm.toLocation} onValueChange={v => setTransferForm({...transferForm, toLocation: v})}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Destination" /></SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => <SelectItem key={w} value={w}>{w}</SelectItem>)}
                  <SelectItem value="New Location">+ New Location</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Quantity to Transfer <span className="text-destructive">*</span></Label><Input type="number" min={1} value={transferForm.quantity || ''} onChange={e => setTransferForm({...transferForm, quantity: parseInt(e.target.value) || 0})} className="h-10 mt-1" placeholder="Enter quantity" required /></div>
            <div className="col-span-1 md:col-span-2"><Label className="text-xs">Notes</Label><Textarea value={transferForm.notes} onChange={e => setTransferForm({...transferForm, notes: e.target.value})} className="mt-1 min-h-[80px]" rows={2} placeholder="Transfer reason or notes..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setTransferOpen(false)}>Cancel</Button><Button onClick={handleStockTransfer}>Transfer Stock</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
