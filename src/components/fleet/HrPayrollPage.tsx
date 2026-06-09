'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DollarSign, Wallet, FileText, Banknote, Plus, ArrowRight, Loader2, Receipt, Clock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function HrPayrollPage() {
  const [records, setRecords] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

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
    setSaving(true)
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
    } catch (e) { toast.error('Failed') } finally { setSaving(false) }
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

  const statCards = [
    { label: 'Total Records', value: records.length, icon: Receipt, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Pending', value: records.filter(p => p.status === 'pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Processed', value: records.filter(p => p.status === 'processed').length, icon: CheckCircle, color: 'text-sky-600', bg: 'bg-sky-50 dark:bg-sky-950/30' },
    { label: 'Total Net Pay', value: fmt(records.reduce((s: number, p: any) => s + (p.netPay || 0), 0)), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div><CardTitle className="text-2xl">Payroll</CardTitle><p className="text-sm text-muted-foreground">Employee payroll processing and history</p></div>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Run Payroll</Button>
          </div>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(s => (
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
            <TableHead className="text-xs">Employee</TableHead><TableHead className="text-xs">Period</TableHead><TableHead className="text-xs hidden md:table-cell">Base</TableHead>
            <TableHead className="text-xs hidden lg:table-cell">Overtime</TableHead><TableHead className="text-xs hidden lg:table-cell">Bonuses</TableHead><TableHead className="text-xs hidden lg:table-cell">Deductions</TableHead>
            <TableHead className="text-xs hidden md:table-cell">Net Pay</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow> :
            records.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No payroll records</TableCell></TableRow> :
            records.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="text-xs font-medium">{p.employee?.firstName} {p.employee?.lastName}</TableCell>
                <TableCell className="text-xs">{p.period}</TableCell>
                <TableCell className="text-xs hidden md:table-cell">{fmt(p.baseSalary)}</TableCell>
                <TableCell className="text-xs hidden lg:table-cell">{fmt(p.overtime)}</TableCell>
                <TableCell className="text-xs hidden lg:table-cell">{fmt(p.bonuses)}</TableCell>
                <TableCell className="text-xs hidden lg:table-cell">{fmt(p.deductions)}</TableCell>
                <TableCell className="text-xs font-medium hidden md:table-cell">{fmt(p.netPay)}</TableCell>
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

      <Dialog open={open} onOpenChange={(v) => { if (!saving) setOpen(v) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Run Payroll</DialogTitle><DialogDescription>Create a new payroll record for an employee.</DialogDescription></DialogHeader>
          <div className="space-y-6 py-2">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <DollarSign className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Payroll Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Employee <span className="text-destructive">*</span></Label>
                  <Select required value={form.employeeId || ''} onValueChange={handleEmployeeChange}>
                    <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select an employee" /></SelectTrigger>
                    <SelectContent>
                      {employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName} ({fmt(e.salary || 0)})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs font-medium text-muted-foreground">Period <span className="text-destructive">*</span></Label><Input required type="month" value={form.period || ''} onChange={e => setForm({ ...form, period: e.target.value })} className="h-10 mt-1" placeholder="e.g. 2024-01" /></div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Wallet className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Compensation</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Base Salary ($)</Label><Input type="number" value={form.baseSalary || '0'} onChange={e => setForm({ ...form, baseSalary: e.target.value })} className="h-10 mt-1" placeholder="0.00" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Overtime ($)</Label><Input type="number" value={form.overtime || '0'} onChange={e => setForm({ ...form, overtime: e.target.value })} className="h-10 mt-1" placeholder="0.00" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Bonuses ($)</Label><Input type="number" value={form.bonuses || '0'} onChange={e => setForm({ ...form, bonuses: e.target.value })} className="h-10 mt-1" placeholder="0.00" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Deductions ($)</Label><Input type="number" value={form.deductions || '0'} onChange={e => setForm({ ...form, deductions: e.target.value })} className="h-10 mt-1" placeholder="0.00" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Net Pay (auto-calculated)</Label><div className="h-10 mt-1 flex items-center px-3 rounded-md border bg-muted text-sm font-medium">{fmt(getNetPay())}</div></div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Additional</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-3"><Label className="text-xs font-medium text-muted-foreground">Notes</Label><Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="min-h-[80px] mt-1" placeholder="Additional payroll notes or comments" /></div>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Payroll</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
