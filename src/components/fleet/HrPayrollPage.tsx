'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Banknote } from 'lucide-react'

export default function HrPayrollPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try { const res = await fetch('/api/fleet/hr?XTransformPort=3000'); if (res.ok) { const j = await res.json(); setEmployees(j.data || []) } } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const payrollRecords = employees.flatMap(e => (e.payrollRecords || []).map((p: any) => ({ ...p, employee: e })))
  const fmt = (n: number) => `$${n?.toLocaleString()}`

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Payroll</h2><p className="text-sm text-muted-foreground">Employee payroll processing and history</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: payrollRecords.length },
          { label: 'Pending', value: payrollRecords.filter(p => p.status === 'pending').length },
          { label: 'Processed', value: payrollRecords.filter(p => p.status === 'processed').length },
          { label: 'Total Net Pay', value: fmt(payrollRecords.reduce((s: number, p: any) => s + (p.netPay || 0), 0)) },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Employee</TableHead><TableHead className="text-xs">Period</TableHead><TableHead className="text-xs">Base</TableHead>
            <TableHead className="text-xs">Overtime</TableHead><TableHead className="text-xs">Deductions</TableHead><TableHead className="text-xs">Net Pay</TableHead><TableHead className="text-xs">Status</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
            payrollRecords.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payroll records</TableCell></TableRow> :
            payrollRecords.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="text-xs font-medium">{p.employee?.firstName} {p.employee?.lastName}</TableCell>
                <TableCell className="text-xs">{p.period}</TableCell>
                <TableCell className="text-xs">{fmt(p.baseSalary)}</TableCell>
                <TableCell className="text-xs">{fmt(p.overtime)}</TableCell>
                <TableCell className="text-xs">{fmt(p.deductions)}</TableCell>
                <TableCell className="text-xs font-medium">{fmt(p.netPay)}</TableCell>
                <TableCell><Badge className={`text-[10px] ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{p.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>
    </div>
  )
}
