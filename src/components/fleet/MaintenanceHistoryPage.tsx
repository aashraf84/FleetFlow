'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { History } from 'lucide-react'

export default function MaintenanceHistoryPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fleet/maintenance?status=completed&XTransformPort=3000')
      if (res.ok) { const j = await res.json(); setRecords(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Maintenance History</h2><p className="text-sm text-muted-foreground">Complete service record history</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: records.length },
          { label: 'Preventive', value: records.filter(r => r.type === 'preventive').length },
          { label: 'Corrective', value: records.filter(r => r.type === 'corrective').length },
          { label: 'Total Cost', value: fmt(records.reduce((s, r) => s + (r.cost || 0), 0)) },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Vehicle</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Category</TableHead>
            <TableHead className="text-xs">Description</TableHead><TableHead className="text-xs">Completed</TableHead><TableHead className="text-xs">Cost</TableHead><TableHead className="text-xs">Vendor</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
            records.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No maintenance history yet</TableCell></TableRow> :
            records.map(r => (
              <TableRow key={r.id}>
                <TableCell className="text-xs font-medium">{r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : 'N/A'}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px] capitalize">{r.type}</Badge></TableCell>
                <TableCell className="text-xs capitalize">{r.category?.replace('_', ' ')}</TableCell>
                <TableCell className="text-xs max-w-48 truncate">{r.description}</TableCell>
                <TableCell className="text-xs">{r.completedDate ? new Date(r.completedDate).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell className="text-xs font-medium">{fmt(r.cost)}</TableCell>
                <TableCell className="text-xs">{r.vendor || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>
    </div>
  )
}
