'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Cog } from 'lucide-react'

export default function WorkshopPage() {
  const [jobCards, setJobCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try { const res = await fetch('/api/fleet/workshop'); if (res.ok) { const j = await res.json(); setJobCards(j.data || []) } } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Workshop Management</h2><p className="text-sm text-muted-foreground">Job cards, mechanics, repair orders, and labor costs</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Job Cards', value: jobCards.length },
          { label: 'Open', value: jobCards.filter(j => j.status === 'open').length },
          { label: 'In Progress', value: jobCards.filter(j => j.status === 'in_progress').length },
          { label: 'Total Labor Cost', value: fmt(jobCards.reduce((s, j) => s + (j.laborCost || 0), 0)) },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Vehicle</TableHead><TableHead className="text-xs">Mechanic</TableHead><TableHead className="text-xs">Labor Hours</TableHead>
            <TableHead className="text-xs">Labor Cost</TableHead><TableHead className="text-xs">Priority</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Started</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
            jobCards.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No job cards. Create maintenance records to generate job cards.</TableCell></TableRow> :
            jobCards.map(j => (
              <TableRow key={j.id}>
                <TableCell className="text-xs font-medium">{j.maintenance?.vehicle ? `${j.maintenance.vehicle.make} ${j.maintenance.vehicle.model}` : 'N/A'}</TableCell>
                <TableCell className="text-xs">{j.mechanicName}</TableCell>
                <TableCell className="text-xs">{j.laborHours}h</TableCell>
                <TableCell className="text-xs font-medium">{fmt(j.laborCost)}</TableCell>
                <TableCell><Badge variant={j.priority === 'urgent' ? 'destructive' : 'outline'} className="text-[10px]">{j.priority}</Badge></TableCell>
                <TableCell><Badge className={`text-[10px] ${j.status === 'open' ? 'bg-amber-100 text-amber-800' : j.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>{j.status?.replace('_', ' ')}</Badge></TableCell>
                <TableCell className="text-xs">{j.startDate ? new Date(j.startDate).toLocaleDateString() : 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>
    </div>
  )
}
