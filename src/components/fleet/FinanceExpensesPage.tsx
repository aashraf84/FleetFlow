'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MinusCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, string> = { pending: 'bg-amber-100 text-amber-800', approved: 'bg-blue-100 text-blue-800', paid: 'bg-emerald-100 text-emerald-800', rejected: 'bg-red-100 text-red-800' }

export default function FinanceExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try { const res = await fetch('/api/fleet/finance/expenses?XTransformPort=3000'); if (res.ok) { const j = await res.json(); setExpenses(j.data || []) } } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/fleet/finance/expenses?XTransformPort=3000', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { toast.success('Expense recorded'); fetchData(); setOpen(false); setForm({}) }
      else toast.error('Failed')
    } catch (e) { toast.error('Failed') }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Expenses</h2><p className="text-sm text-muted-foreground">Track maintenance, fuel, payroll, insurance, and permit expenses</p></div>
        <Button onClick={() => { setForm({ category: 'maintenance', amount: 0, status: 'pending' }); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />Record Expense</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Expenses', value: fmt(expenses.reduce((s, e) => s + (e.amount || 0), 0)) },
          { label: 'Pending', value: fmt(expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0)) },
          { label: 'Approved', value: fmt(expenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0)) },
          { label: 'Paid', value: fmt(expenses.filter(e => e.status === 'paid').reduce((s, e) => s + e.amount, 0)) },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Category</TableHead><TableHead className="text-xs">Description</TableHead><TableHead className="text-xs">Vendor</TableHead>
            <TableHead className="text-xs">Amount</TableHead><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Status</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow> :
            expenses.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No expenses recorded</TableCell></TableRow> :
            expenses.map(e => (
              <TableRow key={e.id}>
                <TableCell className="text-xs"><Badge variant="outline" className="text-[10px] capitalize">{e.category}</Badge></TableCell>
                <TableCell className="text-xs max-w-48 truncate">{e.description || 'N/A'}</TableCell>
                <TableCell className="text-xs">{e.vendor || 'N/A'}</TableCell>
                <TableCell className="text-xs font-medium">{fmt(e.amount)}</TableCell>
                <TableCell className="text-xs">{new Date(e.date).toLocaleDateString()}</TableCell>
                <TableCell><Badge className={`text-[10px] ${statusColors[e.status] || ''}`}>{e.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label className="text-xs">Category</Label><Select value={form.category || 'maintenance'} onValueChange={v => setForm({...form, category: v})}><SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="fuel">Fuel</SelectItem><SelectItem value="payroll">Payroll</SelectItem><SelectItem value="insurance">Insurance</SelectItem><SelectItem value="permits">Permits</SelectItem><SelectItem value="office">Office</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Amount ($)</Label><Input type="number" value={form.amount || ''} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Description</Label><Input value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Vendor</Label><Input value={form.vendor || ''} onChange={e => setForm({...form, vendor: e.target.value})} className="h-9 mt-1" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
