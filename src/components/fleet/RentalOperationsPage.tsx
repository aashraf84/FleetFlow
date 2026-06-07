'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeftRight } from 'lucide-react'

export default function RentalOperationsPage() {
  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fleet/rentals')
      if (res.ok) { const j = await res.json(); setContracts(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'

  const operations = contracts.flatMap(c => (c.operations || []).map((op: any) => ({ ...op, contractNumber: c.contractNumber, customer: c.customer, vehicle: c.vehicle })))

  const stats = [
    { label: 'Total Operations', value: operations.length },
    { label: 'Pickups', value: operations.filter(o => o.type === 'pickup').length },
    { label: 'Returns', value: operations.filter(o => o.type === 'return').length },
    { label: 'Active Contracts', value: contracts.filter(c => c.status === 'active').length },
  ]

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Rental Operations</h2><p className="text-sm text-muted-foreground">Track pickups, returns, extensions, and exchanges</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Contract</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs">Vehicle</TableHead>
                <TableHead className="text-xs">Performed By</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Mileage</TableHead>
                <TableHead className="text-xs">Fuel Level</TableHead>
                <TableHead className="text-xs">Notes</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow> :
                operations.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No operations recorded yet. Operations are created when pickups and returns are processed from reservations.</TableCell></TableRow> :
                operations.map((o, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs font-mono">{o.contractNumber}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] capitalize">{o.type?.replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="text-xs">{o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{o.vehicle ? `${o.vehicle.make} ${o.vehicle.model}` : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{o.performedBy || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{o.performedAt ? fmtDate(o.performedAt) : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{o.mileageAtTime?.toLocaleString() || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{o.fuelLevelAtTime || 'N/A'}</TableCell>
                    <TableCell className="text-xs max-w-32 truncate">{o.conditionNotes || o.notes || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
