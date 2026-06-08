'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus, MoreHorizontal, CheckCircle2, RotateCcw, Trash2, XCircle
} from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-violet-100 text-violet-800',
}

const emptyForm = {
  invoiceId: '', amount: 0, method: 'cash', reference: '',
  paidDate: new Date().toISOString().split('T')[0], notes: '', status: 'completed',
}

export default function FinancePaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>(emptyForm)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [payRes, invRes] = await Promise.all([
        fetch('/api/fleet/finance/payments'),
        fetch('/api/fleet/finance'),
      ])
      if (payRes.ok) { const j = await payRes.json(); setPayments(j.data || []) }
      if (invRes.ok) { const j = await invRes.json(); setInvoices(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/fleet/finance/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { toast.success('Payment recorded'); fetchData(); setOpen(false); setForm(emptyForm) }
      else toast.error('Failed to record payment')
    } catch (e) { toast.error('Failed') }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/fleet/finance/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        toast.success(`Payment marked as ${status}`)
        fetchData()
      } else toast.error('Failed to update payment status')
    } catch (e) { toast.error('Failed') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) return
    try {
      const res = await fetch(`/api/fleet/finance/payments?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Payment deleted'); fetchData() }
      else toast.error('Failed to delete payment')
    } catch (e) { toast.error('Failed') }
  }

  const openCreate = () => {
    setForm({ ...emptyForm })
    setOpen(true)
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`

  const stats = [
    { label: 'Total Payments', value: payments.length },
    { label: 'Completed', value: fmt(payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0)) },
    { label: 'Pending', value: fmt(payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)) },
    { label: 'Refunded', value: fmt(payments.filter(p => p.status === 'refunded').reduce((s, p) => s + p.amount, 0)) },
  ]

  // Get unpaid/partial invoices for payment recording
  const eligibleInvoices = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payments</h2>
          <p className="text-sm text-muted-foreground">Track all payment transactions</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Record Payment</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Invoice</TableHead>
              <TableHead className="text-xs">Amount</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Method</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Reference</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
              <TableHead className="text-xs">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : payments.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payments recorded. Click &quot;Record Payment&quot; to add one.</TableCell></TableRow>
              ) : (
                payments.map(p => (
                  <TableRow key={p.id} className="hover:bg-accent/50">
                    <TableCell className="text-xs font-mono">{p.invoice?.invoiceNumber || 'N/A'}</TableCell>
                    <TableCell className="text-xs font-medium">{fmt(p.amount)}</TableCell>
                    <TableCell className="text-xs capitalize hidden md:table-cell">{p.method?.replace('_', ' ')}</TableCell>
                    <TableCell className="text-xs hidden md:table-cell">{p.reference || 'N/A'}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${statusColors[p.status] || ''}`}>{p.status}</Badge></TableCell>
                    <TableCell className="text-xs hidden md:table-cell">{new Date(p.paidDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {p.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(p.id, 'completed')}>
                              <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Mark as Completed
                            </DropdownMenuItem>
                          )}
                          {p.status === 'completed' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(p.id, 'refunded')}>
                              <RotateCcw className="mr-2 h-3.5 w-3.5" /> Refund
                            </DropdownMenuItem>
                          )}
                          {p.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(p.id, 'failed')}>
                              <XCircle className="mr-2 h-3.5 w-3.5" /> Mark as Failed
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent></Card>

      {/* Record Payment Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-xs">Invoice (optional)</Label>
              <Select value={form.invoiceId || '_none'} onValueChange={v => setForm({ ...form, invoiceId: v === '_none' ? '' : v })}>
                <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Select invoice" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">No invoice</SelectItem>
                  {eligibleInvoices.map(inv => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - {fmt(inv.totalAmount)} ({inv.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Amount ($)</Label>
                <Input type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Method</Label>
                <Select value={form.method || 'cash'} onValueChange={v => setForm({ ...form, method: v })}>
                  <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Reference</Label>
                <Input value={form.reference || ''} onChange={e => setForm({ ...form, reference: e.target.value })} className="h-9 mt-1" placeholder="Transaction ref" />
              </div>
              <div>
                <Label className="text-xs">Payment Date</Label>
                <Input type="date" value={form.paidDate || ''} onChange={e => setForm({ ...form, paidDate: e.target.value })} className="h-9 mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status || 'completed'} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 text-xs" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
