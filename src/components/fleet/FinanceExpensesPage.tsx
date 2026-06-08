'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus, Pencil, Trash2, MoreHorizontal, CheckCircle2, XCircle, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  paid: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
}

const emptyForm = {
  category: 'maintenance', amount: 0, description: '', vendor: '', status: 'pending',
  date: new Date().toISOString().split('T')[0], paymentMethod: '', notes: '',
}

export default function FinanceExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fleet/finance/expenses')
      if (res.ok) { const j = await res.json(); setExpenses(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditId(null)
    setForm({ ...emptyForm })
    setOpen(true)
  }

  const openEdit = (exp: any) => {
    setEditId(exp.id)
    setForm({
      category: exp.category,
      amount: exp.amount,
      description: exp.description || '',
      vendor: exp.vendor || '',
      date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : '',
      paymentMethod: exp.paymentMethod || '',
      notes: exp.notes || '',
      status: exp.status,
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (editId) {
        const res = await fetch('/api/fleet/finance/expenses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...form }),
        })
        if (res.ok) { toast.success('Expense updated'); fetchData(); setOpen(false); setEditId(null); setForm(emptyForm) }
        else toast.error('Failed to update expense')
      } else {
        const res = await fetch('/api/fleet/finance/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (res.ok) { toast.success('Expense recorded'); fetchData(); setOpen(false); setForm(emptyForm) }
        else toast.error('Failed to record expense')
      }
    } catch (e) { toast.error('Failed') } finally { setSaving(false) }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/fleet/finance/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        toast.success(`Expense ${status === 'approved' ? 'approved' : 'rejected'}`)
        fetchData()
      } else toast.error('Failed to update status')
    } catch (e) { toast.error('Failed') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    try {
      const res = await fetch(`/api/fleet/finance/expenses?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Expense deleted'); fetchData() }
      else toast.error('Failed to delete expense')
    } catch (e) { toast.error('Failed') }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`

  const stats = [
    { label: 'Total Expenses', value: fmt(expenses.reduce((s, e) => s + (e.amount || 0), 0)) },
    { label: 'Pending', value: fmt(expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0)) },
    { label: 'Approved', value: fmt(expenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0)) },
    { label: 'Paid', value: fmt(expenses.filter(e => e.status === 'paid' || e.status === 'completed').reduce((s, e) => s + e.amount, 0)) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Expenses</h2>
          <p className="text-sm text-muted-foreground">Track maintenance, fuel, payroll, insurance, and permit expenses</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Record Expense</Button>
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
              <TableHead className="text-xs">Category</TableHead>
              <TableHead className="text-xs">Description</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Vendor</TableHead>
              <TableHead className="text-xs">Amount</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : expenses.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No expenses recorded</TableCell></TableRow>
              ) : (
                expenses.map(e => (
                  <TableRow key={e.id} className="hover:bg-accent/50">
                    <TableCell className="text-xs"><Badge variant="outline" className="text-[10px] capitalize">{e.category}</Badge></TableCell>
                    <TableCell className="text-xs max-w-48 truncate">{e.description || 'N/A'}</TableCell>
                    <TableCell className="text-xs hidden md:table-cell">{e.vendor || 'N/A'}</TableCell>
                    <TableCell className="text-xs font-medium">{fmt(e.amount)}</TableCell>
                    <TableCell className="text-xs hidden md:table-cell">{new Date(e.date).toLocaleDateString()}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${statusColors[e.status] || ''}`}>{e.status}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(e)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                          {e.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => handleStatusChange(e.id, 'approved')}>
                                <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(e.id, 'rejected')}>
                                <XCircle className="mr-2 h-3.5 w-3.5" /> Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {e.status === 'approved' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(e.id, 'completed')}>
                              <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Mark as Completed
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(e.id)}>
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

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => { if (!saving) setOpen(v) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Expense' : 'Record Expense'}</DialogTitle>
            <DialogDescription>{editId ? 'Modify the expense details below.' : 'Fill in the details to record a new expense.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Category <span className="text-destructive">*</span></Label>
                <Select value={form.category || 'maintenance'} onValueChange={v => setForm({ ...form, category: v })} required>
                  <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="fuel">Fuel</SelectItem>
                    <SelectItem value="payroll">Payroll</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="permits">Permits</SelectItem>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Amount ($) <span className="text-destructive">*</span></Label>
                <Input type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="h-10 mt-1" placeholder="0.00" required />
              </div>
            </div>
            <div className="col-span-1 md:col-span-2">
              <Label className="text-xs">Description <span className="text-destructive">*</span></Label>
              <Input value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="h-10 mt-1" placeholder="Enter expense description" required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Vendor</Label>
                <Input value={form.vendor || ''} onChange={e => setForm({ ...form, vendor: e.target.value })} className="h-10 mt-1" placeholder="Vendor or supplier name" />
              </div>
              <div>
                <Label className="text-xs">Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} className="h-10 mt-1" required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Payment Method</Label>
                <Select value={form.paymentMethod || ''} onValueChange={v => setForm({ ...form, paymentMethod: v })}>
                  <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select payment method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editId && (
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={form.status || 'pending'} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="col-span-1 md:col-span-2">
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 min-h-[80px]" placeholder="Additional notes or comments..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editId ? 'Update' : 'Record'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
