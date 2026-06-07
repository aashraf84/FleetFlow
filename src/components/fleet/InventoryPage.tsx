'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Warehouse } from 'lucide-react'

export default function InventoryPage() {
  const [parts, setParts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try { const res = await fetch('/api/fleet/parts'); if (res.ok) { const j = await res.json(); setParts(j.data?.parts || []) } } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const totalValue = parts.reduce((s, p) => s + (p.quantityInStock || 0) * (p.unitCost || 0), 0)
  const byWarehouse: Record<string, { count: number; value: number }> = {}
  parts.forEach(p => { const w = p.warehouse || 'Default'; byWarehouse[w] = byWarehouse[w] || { count: 0, value: 0 }; byWarehouse[w].count++; byWarehouse[w].value += (p.quantityInStock || 0) * (p.unitCost || 0) })

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Inventory Management</h2><p className="text-sm text-muted-foreground">Stock transfers, adjustments, and goods receipts</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: parts.length },
          { label: 'Total Value', value: `$${totalValue.toLocaleString()}` },
          { label: 'Warehouses', value: Object.keys(byWarehouse).length },
          { label: 'Low Stock Items', value: parts.filter(p => p.quantityInStock <= p.reorderLevel).length },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Warehouse Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(byWarehouse).map(([name, data]) => (
              <Card key={name}><CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2"><Warehouse className="h-4 w-4 text-muted-foreground" /><span className="font-medium text-sm">{name}</span></div>
                <div className="space-y-1 text-xs"><div className="flex justify-between"><span className="text-muted-foreground">Items:</span><span>{data.count}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Value:</span><span className="font-medium">${data.value.toLocaleString()}</span></div></div>
              </CardContent></Card>
            ))}
            {Object.keys(byWarehouse).length === 0 && <div className="col-span-3 text-center py-8 text-muted-foreground">No warehouse data available</div>}
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
              <TableRow key={p.id}>
                <TableCell className="text-xs font-mono">{p.partNumber}</TableCell>
                <TableCell className="text-xs">{p.name}</TableCell>
                <TableCell className="text-xs">{p.warehouse || 'Default'}</TableCell>
                <TableCell className="text-xs">{p.quantityInStock}</TableCell>
                <TableCell className="text-xs">${p.unitCost}</TableCell>
                <TableCell className="text-xs font-medium">${((p.quantityInStock || 0) * (p.unitCost || 0)).toLocaleString()}</TableCell>
                <TableCell><Badge variant={p.quantityInStock <= p.reorderLevel ? 'destructive' : 'secondary'} className="text-[10px]">{p.quantityInStock <= p.reorderLevel ? 'Low Stock' : 'In Stock'}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>
    </div>
  )
}
