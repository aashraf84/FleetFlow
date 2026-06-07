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
import { Receipt, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, string> = { draft: 'bg-gray-100 text-gray-800', pending: 'bg-amber-100 text-amber-800', paid: 'bg-emerald-100 text-emerald-800', partial: 'bg-blue-100 text-blue-800', overdue: 'bg-red-100 text-red-800', cancelled: 'bg-gray-100 text-gray-800' }

export default function FinanceInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [form, setForm] = useState<any>({})

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try {
      const [invRes, cusRes] = await Promise.all([fetch('/api/fleet/finance?XTransformPort=3000'), fetch('/api/fleet/customers?XTransformPort=3000')])
      if (invRes.ok) { const j = await invRes.json(); setInvoices(j.data || []) }
      if (cusRes.ok) { const j = await cusRes.json(); setCustomers(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/fleet/finance?XTransformPort=3000', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { toast.success('Invoice created'); fetchData(); setOpen(false); setForm({}) }
      else toast.error('Failed')
    } catch (e) { toast.error('Failed') }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`
  const stats = [
    { label: 'Total Invoices', value: invoices.length },
    { label: 'Paid', value: invoices.filter(i => i.status === 'paid').length },
    { label: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length },
    { label: 'Total Revenue', value: fmt(invoices.reduce((s, i) => s + (i.totalAmount || 0), 0)) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Invoices</h2><p className="text-sm text-muted-foreground">Rental invoices, transport invoices, and quotations</p></div>
        <Button onClick={() => { setForm({ type: 'rental', amount: 0, tax: 0, totalAmount: 0, status: 'pending', dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] }); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />Create Invoice</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{stats.map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}</div>
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Invoice #</TableHead><TableHead className="text-xs">Customer</TableHead><TableHead className="text-xs">Type</TableHead>
            <TableHead className="text-xs">Amount</TableHead><TableHead className="text-xs">Tax</TableHead><TableHead className="text-xs">Total</TableHead><TableHead className="text-xs">Due Date</TableHead><TableHead className="text-xs">Status</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow> :
            invoices.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No invoices yet</TableCell></TableRow> :
            invoices.map(i => (
              <TableRow key={i.id}>
                <TableCell className="text-xs font-mono">{i.invoiceNumber}</TableCell>
                <TableCell className="text-xs">{i.customer ? `${i.customer.firstName} ${i.customer.lastName}` : 'N/A'}</TableCell>
                <TableCell className="text-xs capitalize">{i.type}</TableCell>
                <TableCell className="text-xs">{fmt(i.amount)}</TableCell>
                <TableCell className="text-xs">{fmt(i.tax)}</TableCell>
                <TableCell className="text-xs font-medium">{fmt(i.totalAmount)}</TableCell>
                <TableCell className="text-xs">{i.dueDate ? new Date(i.dueDate).toLocaleDateString() : 'N/A'}</TableCell>
                <TableCell><Badge className={`text-[10px] ${statusColors[i.status] || ''}`}>{i.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label className="text-xs">Customer</Label><Select value={form.customerId || ''} onValueChange={v => setForm({...form, customerId: v})}><SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Select customer" /></SelectTrigger><SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Type</Label><Select value={form.type || 'rental'} onValueChange={v => setForm({...form, type: v})}><SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rental">Rental</SelectItem><SelectItem value="transport">Transport</SelectItem><SelectItem value="fuel">Fuel</SelectItem><SelectItem value="service">Service</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label className="text-xs">Amount ($)</Label><Input type="number" value={form.amount || ''} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} className="h-9 mt-1" /></div>
              <div><Label className="text-xs">Tax ($)</Label><Input type="number" value={form.tax || ''} onChange={e => setForm({...form, tax: parseFloat(e.target.value)})} className="h-9 mt-1" /></div>
              <div><Label className="text-xs">Total ($)</Label><Input type="number" value={form.totalAmount || ''} onChange={e => setForm({...form, totalAmount: parseFloat(e.target.value)})} className="h-9 mt-1" /></div>
            </div>
            <div><Label className="text-xs">Due Date</Label><Input type="date" value={form.dueDate || ''} onChange={e => setForm({...form, dueDate: e.target.value})} className="h-9 mt-1" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
