'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { History, Shield, Wrench, DollarSign } from 'lucide-react'

export default function MaintenanceHistoryPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fleet/maintenance?status=completed')
      if (res.ok) { const j = await res.json(); setRecords(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`

  const stats = [
    { label: 'Total Records', value: records.length, icon: History, color: 'text-slate-600', bg: 'bg-slate-50 dark:bg-slate-950/30' },
    { label: 'Preventive', value: records.filter(r => r.type === 'preventive').length, icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Corrective', value: records.filter(r => r.type === 'corrective').length, icon: Wrench, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30' },
    { label: 'Total Cost', value: fmt(records.reduce((s, r) => s + (r.cost || 0), 0)), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold">Maintenance History</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Complete service record history</CardDescription>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                <div className={`p-1.5 rounded-md ${s.bg}`}><s.icon className={`h-3.5 w-3.5 ${s.color}`} /></div>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[440px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Vehicle</TableHead>
            <TableHead className="text-xs">Type</TableHead>
            <TableHead className="text-xs hidden md:table-cell">Category</TableHead>
            <TableHead className="text-xs hidden md:table-cell">Description</TableHead>
            <TableHead className="text-xs hidden lg:table-cell">Completed</TableHead>
            <TableHead className="text-xs hidden lg:table-cell">Cost</TableHead>
            <TableHead className="text-xs hidden lg:table-cell">Vendor</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
            records.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No maintenance history yet</TableCell></TableRow> :
            records.map(r => (
              <TableRow key={r.id}>
                <TableCell className="text-xs font-medium">{r.vehicle ? `${r.vehicle.make} ${r.vehicle.model}` : 'N/A'}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px] capitalize">{r.type}</Badge></TableCell>
                <TableCell className="text-xs capitalize hidden md:table-cell">{r.category?.replace('_', ' ')}</TableCell>
                <TableCell className="text-xs max-w-48 truncate hidden md:table-cell">{r.description}</TableCell>
                <TableCell className="text-xs hidden lg:table-cell">{r.completedDate ? new Date(r.completedDate).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell className="text-xs font-medium hidden lg:table-cell">{fmt(r.cost)}</TableCell>
                <TableCell className="text-xs hidden lg:table-cell">{r.vendor || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>
    </div>
  )
}
