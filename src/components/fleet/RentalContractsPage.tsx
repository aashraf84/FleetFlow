'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, Download } from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800', active: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-blue-100 text-blue-800', terminated: 'bg-red-100 text-red-800',
}

export default function RentalContractsPage() {
  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fleet/rentals?XTransformPort=3000')
      if (res.ok) { const j = await res.json(); setContracts(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'

  const stats = [
    { label: 'Total Contracts', value: contracts.length },
    { label: 'Active', value: contracts.filter(c => c.status === 'active').length },
    { label: 'Completed', value: contracts.filter(c => c.status === 'completed').length },
    { label: 'Total Value', value: fmt(contracts.reduce((s, c) => s + (c.totalAmount || 0), 0)) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Rental Contracts</h2><p className="text-sm text-muted-foreground">View and manage rental contracts</p></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Contract #</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs">Vehicle</TableHead>
                <TableHead className="text-xs">Period</TableHead>
                <TableHead className="text-xs">Daily Rate</TableHead>
                <TableHead className="text-xs">Total</TableHead>
                <TableHead className="text-xs">Deposit</TableHead>
                <TableHead className="text-xs">Insurance</TableHead>
                <TableHead className="text-xs">Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow> :
                contracts.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No contracts found</TableCell></TableRow> :
                contracts.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs font-mono">{c.contractNumber}</TableCell>
                    <TableCell className="text-xs">{c.customer ? `${c.customer.firstName} ${c.customer.lastName}` : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{c.vehicle ? `${c.vehicle.make} ${c.vehicle.model}` : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{fmtDate(c.startDate)} - {fmtDate(c.endDate)}</TableCell>
                    <TableCell className="text-xs">{fmt(c.dailyRate)}</TableCell>
                    <TableCell className="text-xs font-medium">{fmt(c.totalAmount)}</TableCell>
                    <TableCell className="text-xs">{fmt(c.depositAmount)}</TableCell>
                    <TableCell className="text-xs capitalize">{c.insuranceType}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${statusColors[c.status] || ''}`}>{c.status}</Badge></TableCell>
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
