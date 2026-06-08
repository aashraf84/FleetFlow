'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Banknote, Plus, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

export default function HrPayrollPage() {
  const [records, setRecords] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>({})

  const fetchData = async () => {
    setLoading(true)
    try {
      const [payRes, empRes] = await Promise.all([
        fetch('/api/fleet/hr/payroll'),
        fetch('/api/fleet/hr'),
      ])
      if (payRes.ok) { const j = await payRes.json(); setRecords(j.data || []) }
      if (empRes.ok) { const j = await empRes.json(); setEmployees(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const fmt = (n: number) => `$${(n || 0).toLocaleString()}`

  const getNetPay = () => {
    const base = parseFloat(form.baseSalary) || 0
    const ot = parseFloat(form.overtime) || 0
    const bon = parseFloat(form.bonuses) || 0
    const ded = parseFloat(form.deductions) || 0
    return Math.round((base + ot + bon - ded) * 100) / 100
  }

  const openCreate = () => {
    setForm({ employeeId: '', period: new Date().toISOString().slice(0, 7), baseSalary: '0', overtime: '0', bonuses: '0', deductions: '0', notes: '' })
    setOpen(true)
  }

  const handleEmployeeChange = (empId: string) => {
    const emp = employees.find((e: any) => e.id === empId)
    setForm({ ...form, employeeId: empId, baseSalary: String(emp?.salary || 0) })
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/fleet/hr/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Payroll record created')
        fetchData()
        setOpen(false)
        setForm({})
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed')
      }
    } catch (e) { toast.error('Failed') }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/fleet/hr/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        toast.success(`Payroll ${status}`)
        fetchData()
      } else {
        toast.error('Failed to update')
      }
    } catch (e) { toast.error('Failed') }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'paid': return 'bg-emerald-100 text-emerald-800'
      case 'processed': return 'bg-sky-100 text-sky-800'
      default: return 'bg-amber-100 text-amber-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Payroll</h2><p className="text-sm text-muted-foreground">Employee payroll processing and history</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Run Payroll</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: records.length },
          { label: 'Pending', value: records.filter(p => p.status === 'pending').length },
          { label: 'Processed', value: records.filter(p => p.status === 'processed').length },
          { label: 'Total Net Pay', value: fmt(records.reduce((s: number, p: any) => s + (p.netPay || 0), 0)) },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Employee</TableHead><TableHead className="text-xs">Period</TableHead><TableHead className="text-xs">Base</TableHead>
            <TableHead className="text-xs">Overtime</TableHead><TableHead className="text-xs">Bonuses</TableHead><TableHead className="text-xs">Deductions</TableHead>
            <TableHead className="text-xs">Net Pay</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow> :
            records.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No payroll records</TableCell></TableRow> :
            records.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="text-xs font-medium">{p.employee?.firstName} {p.employee?.lastName}</TableCell>
                <TableCell className="text-xs">{p.period}</TableCell>
                <TableCell className="text-xs">{fmt(p.baseSalary)}</TableCell>
                <TableCell className="text-xs">{fmt(p.overtime)}</TableCell>
                <TableCell className="text-xs">{fmt(p.bonuses)}</TableCell>
                <TableCell className="text-xs">{fmt(p.deductions)}</TableCell>
                <TableCell className="text-xs font-medium">{fmt(p.netPay)}</TableCell>
                <TableCell><Badge className={`text-[10px] ${statusColor(p.status)}`}>{p.status}</Badge></TableCell>
                <TableCell>
                  {p.status === 'pending' && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateStatus(p.id, 'processed')}>Process</Button>
                  )}
                  {p.status === 'processed' && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600" onClick={() => updateStatus(p.id, 'paid')}>Mark Paid</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Run Payroll</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2"><Label className="text-xs">Employee</Label>
              <Select value={form.employeeId || ''} onValueChange={handleEmployeeChange}>
                <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName} ({fmt(e.salary || 0)})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Period</Label><Input type="month" value={form.period || ''} onChange={e => setForm({ ...form, period: e.target.value })} className="h-9 mt-1" /></div>
            <div></div>
            <div><Label className="text-xs">Base Salary ($)</Label><Input type="number" value={form.baseSalary || '0'} onChange={e => setForm({ ...form, baseSalary: e.target.value })} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Overtime ($)</Label><Input type="number" value={form.overtime || '0'} onChange={e => setForm({ ...form, overtime: e.target.value })} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Bonuses ($)</Label><Input type="number" value={form.bonuses || '0'} onChange={e => setForm({ ...form, bonuses: e.target.value })} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Deductions ($)</Label><Input type="number" value={form.deductions || '0'} onChange={e => setForm({ ...form, deductions: e.target.value })} className="h-9 mt-1" /></div>
            <div className="col-span-2"><Label className="text-xs">Net Pay (auto-calculated)</Label><div className="h-9 mt-1 flex items-center px-3 rounded-md border bg-muted text-sm font-medium">{fmt(getNetPay())}</div></div>
            <div className="col-span-2"><Label className="text-xs">Notes</Label><Input value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="h-9 mt-1" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Create Payroll</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
