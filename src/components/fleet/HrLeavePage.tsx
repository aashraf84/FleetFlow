'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Palmtree } from 'lucide-react'

export default function HrLeavePage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try { const res = await fetch('/api/fleet/hr'); if (res.ok) { const j = await res.json(); setEmployees(j.data || []) } } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const leaveRecords = employees.flatMap(e => (e.leaveRecords || []).map((l: any) => ({ ...l, employee: e })))

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Leave Management</h2><p className="text-sm text-muted-foreground">Track and manage employee leave requests</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: leaveRecords.length },
          { label: 'Pending', value: leaveRecords.filter(l => l.status === 'pending').length },
          { label: 'Approved', value: leaveRecords.filter(l => l.status === 'approved').length },
          { label: 'On Leave Now', value: leaveRecords.filter(l => l.status === 'approved' && new Date(l.startDate) <= new Date() && new Date(l.endDate) >= new Date()).length },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Employee</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Start</TableHead>
            <TableHead className="text-xs">End</TableHead><TableHead className="text-xs">Days</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Notes</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
            leaveRecords.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No leave records</TableCell></TableRow> :
            leaveRecords.map((l: any) => (
              <TableRow key={l.id}>
                <TableCell className="text-xs font-medium">{l.employee?.firstName} {l.employee?.lastName}</TableCell>
                <TableCell className="text-xs capitalize">{l.leaveType}</TableCell>
                <TableCell className="text-xs">{new Date(l.startDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-xs">{new Date(l.endDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-xs">{l.days}</TableCell>
                <TableCell><Badge className={`text-[10px] ${l.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : l.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{l.status}</Badge></TableCell>
                <TableCell className="text-xs max-w-32 truncate">{l.notes || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>
    </div>
  )
}
