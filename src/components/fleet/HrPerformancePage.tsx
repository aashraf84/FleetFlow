'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Award } from 'lucide-react'

export default function HrPerformancePage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try { const res = await fetch('/api/fleet/hr'); if (res.ok) { const j = await res.json(); setEmployees(j.data || []) } } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const reviews = employees.flatMap(e => (e.performanceReviews || []).map((r: any) => ({ ...r, employee: e })))

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Performance Reviews</h2><p className="text-sm text-muted-foreground">Employee performance tracking and evaluations</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Reviews', value: reviews.length },
          { label: 'Avg Rating', value: reviews.length > 0 ? (reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '0' },
          { label: 'Top Performers', value: reviews.filter((r: any) => r.rating >= 4.5).length },
          { label: 'Needs Improvement', value: reviews.filter((r: any) => r.rating < 3).length },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Employee</TableHead><TableHead className="text-xs">Reviewer</TableHead><TableHead className="text-xs">Period</TableHead>
            <TableHead className="text-xs">Rating</TableHead><TableHead className="text-xs">Goals</TableHead><TableHead className="text-xs">Feedback</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow> :
            reviews.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No performance reviews</TableCell></TableRow> :
            reviews.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs font-medium">{r.employee?.firstName} {r.employee?.lastName}</TableCell>
                <TableCell className="text-xs">{r.reviewerName}</TableCell>
                <TableCell className="text-xs">{r.period}</TableCell>
                <TableCell className="text-xs"><Badge variant={r.rating >= 4 ? 'default' : r.rating >= 3 ? 'secondary' : 'destructive'} className="text-[10px]">{'★'.repeat(Math.round(r.rating))} {r.rating}/5</Badge></TableCell>
                <TableCell className="text-xs max-w-32 truncate">{r.goals || 'N/A'}</TableCell>
                <TableCell className="text-xs max-w-32 truncate">{r.feedback || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>
    </div>
  )
}
