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
  Receipt, Plus, Pencil, Trash2, MoreHorizontal, Send, CheckCircle2, XCircle, Eye, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-amber-100 text-amber-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-emerald-100 text-emerald-800',
  partial: 'bg-cyan-100 text-cyan-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

const emptyForm: any = {
  customerId: '', subtotal: 0, taxAmount: 0, totalAmount: 0,
  status: 'draft', dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  issueDate: new Date().toISOString().split('T')[0],
  notes: '', items: [],
}

export default function FinanceInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [viewInvoice, setViewInvoice] = useState<any>(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [invRes, cusRes] = await Promise.all([
        fetch('/api/fleet/finance'),
        fetch('/api/fleet/customers'),
      ])
      if (invRes.ok) { const j = await invRes.json(); setInvoices(j.data || []) }
      if (cusRes.ok) { const j = await cusRes.json(); setCustomers(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditId(null)
    setForm({ ...emptyForm, items: [] })
    setOpen(true)
  }

  const openEdit = (inv: any) => {
    setEditId(inv.id)
    setForm({
      customerId: inv.customerId,
      subtotal: inv.subtotal ?? 0,
      taxAmount: inv.taxAmount ?? 0,
      totalAmount: inv.totalAmount ?? 0,
      issueDate: inv.issueDate ? new Date(inv.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
      notes: inv.notes || '',
      status: inv.status,
      items: (inv.items || []).map((it: any) => ({
        description: it.description || '',
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || 0,
        total: it.total || 0,
      })),
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const { amount, tax, ...rest } = form as any
      const payload = {
        ...rest,
        subtotal: rest.subtotal ?? amount ?? 0,
        taxAmount: rest.taxAmount ?? tax ?? 0,
        issueDate: rest.issueDate || new Date().toISOString(),
      }
      if (editId) {
        const res = await fetch('/api/fleet/finance', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...payload }),
        })
        if (res.ok) { toast.success('Invoice updated'); fetchData(); setOpen(false); setEditId(null); setForm({}) }
        else toast.error('Failed to update invoice')
      } else {
        const res = await fetch('/api/fleet/finance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) { toast.success('Invoice created'); fetchData(); setOpen(false); setForm({}) }
        else toast.error('Failed to create invoice')
      }
    } catch (e) { toast.error('Failed') } finally { setSaving(false) }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/fleet/finance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, ...(status === 'paid' ? { paidDate: new Date().toISOString() } : {}) }),
      })
      if (res.ok) {
        toast.success(`Invoice marked as ${status}`)
        fetchData()
      } else toast.error('Failed to update status')
    } catch (e) { toast.error('Failed') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    try {
      const res = await fetch(`/api/fleet/finance?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Invoice deleted'); fetchData() }
      else toast.error('Failed to delete invoice')
    } catch (e) { toast.error('Failed') }
  }

  const addItem = () => {
    setForm({ ...form, items: [...(form.items || []), { description: '', quantity: 1, unitPrice: 0, total: 0 }] })
  }

  const updateItem = (idx: number, field: string, value: any) => {
    const items = [...(form.items || [])]
    items[idx] = { ...items[idx], [field]: value }
    if (field === 'quantity' || field === 'unitPrice') {
      items[idx].total = (items[idx].quantity || 0) * (items[idx].unitPrice || 0)
    }
    const subtotal = items.reduce((s: number, it: any) => s + (it.total || 0), 0)
    setForm({ ...form, items, subtotal, totalAmount: subtotal + (form.taxAmount || 0) })
  }

  const removeItem = (idx: number) => {
    const items = (form.items || []).filter((_: any, i: number) => i !== idx)
    const subtotal = items.reduce((s: number, it: any) => s + (it.total || 0), 0)
    setForm({ ...form, items, subtotal, totalAmount: subtotal + (form.taxAmount || 0) })
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
        <div>
          <h2 className="text-2xl font-bold">Invoices</h2>
          <p className="text-sm text-muted-foreground">Rental invoices, transport invoices, and quotations</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Create Invoice</Button>
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
              <TableHead className="text-xs">Invoice #</TableHead>
              <TableHead className="text-xs">Customer</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Type</TableHead>
              <TableHead className="text-xs">Total</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Due Date</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : invoices.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No invoices yet</TableCell></TableRow>
              ) : (
                invoices.map(i => (
                  <TableRow key={i.id} className="hover:bg-accent/50">
                    <TableCell className="text-xs font-mono">{i.invoiceNumber}</TableCell>
                    <TableCell className="text-xs">{i.customer ? `${i.customer.firstName} ${i.customer.lastName}` : 'N/A'}</TableCell>
                    <TableCell className="text-xs capitalize hidden md:table-cell">{i.type || '—'}</TableCell>
                    <TableCell className="text-xs font-medium">{fmt(i.totalAmount)}</TableCell>
                    <TableCell className="text-xs hidden md:table-cell">{i.dueDate ? new Date(i.dueDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${statusColors[i.status] || ''}`}>{i.status}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewInvoice(i)}>
                            <Eye className="mr-2 h-3.5 w-3.5" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(i)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                          {(i.status === 'draft' || i.status === 'pending') && (
                            <DropdownMenuItem onClick={() => handleStatusChange(i.id, 'sent')}>
                              <Send className="mr-2 h-3.5 w-3.5" /> Mark as Sent
                            </DropdownMenuItem>
                          )}
                          {i.status !== 'paid' && i.status !== 'cancelled' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(i.id, 'paid')}>
                              <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Mark as Paid
                            </DropdownMenuItem>
                          )}
                          {i.status !== 'cancelled' && i.status !== 'paid' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(i.id, 'cancelled')}>
                              <XCircle className="mr-2 h-3.5 w-3.5" /> Cancel
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(i.id)}>
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
            <DialogTitle>{editId ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
            <DialogDescription>{editId ? 'Modify the invoice details below.' : 'Fill in the details to create a new invoice.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Customer <span className="text-destructive">*</span></Label>
                <Select value={form.customerId || ''} onValueChange={v => setForm({ ...form, customerId: v })} disabled={!!editId} required>
                  <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select a customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={form.type || 'rental'} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select invoice type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rental">Rental</SelectItem>
                    <SelectItem value="transport">Transport</SelectItem>
                    <SelectItem value="fuel">Fuel</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-medium">Line Items</Label>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addItem}>
                  <Plus className="h-3 w-3 mr-1" /> Add Item
                </Button>
              </div>
              {(form.items || []).length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No line items added</p>
              ) : (
                <div className="space-y-2">
                  {(form.items || []).map((item: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        {idx === 0 && <Label className="text-[10px] text-muted-foreground">Description</Label>}
                        <Input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="h-8 text-xs" placeholder="Item description" />
                      </div>
                      <div className="col-span-2">
                        {idx === 0 && <Label className="text-[10px] text-muted-foreground">Qty</Label>}
                        <Input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} className="h-8 text-xs" />
                      </div>
                      <div className="col-span-2">
                        {idx === 0 && <Label className="text-[10px] text-muted-foreground">Price</Label>}
                        <Input type="number" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
                      </div>
                      <div className="col-span-2">
                        {idx === 0 && <Label className="text-[10px] text-muted-foreground">Total</Label>}
                        <Input type="number" value={item.total} readOnly className="h-8 text-xs bg-muted" />
                      </div>
                      <div className="col-span-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(idx)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Subtotal ($)</Label>
                <Input type="number" value={form.subtotal || ''} onChange={e => {
                  const val = parseFloat(e.target.value) || 0
                  setForm({ ...form, subtotal: val, totalAmount: val + (form.taxAmount || 0) })
                }} className="h-10 mt-1" placeholder="0.00" />
              </div>
              <div>
                <Label className="text-xs">Tax ($)</Label>
                <Input type="number" value={form.taxAmount || ''} onChange={e => {
                  const val = parseFloat(e.target.value) || 0
                  setForm({ ...form, taxAmount: val, totalAmount: (form.subtotal || 0) + val })
                }} className="h-10 mt-1" placeholder="0.00" />
              </div>
              <div>
                <Label className="text-xs">Total ($)</Label>
                <Input type="number" value={form.totalAmount || ''} readOnly className="h-10 mt-1 bg-muted font-medium" placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Issue Date</Label>
                <Input type="date" value={form.issueDate || ''} onChange={e => setForm({ ...form, issueDate: e.target.value })} className="h-10 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Due Date <span className="text-destructive">*</span></Label>
                <Input type="date" value={form.dueDate || ''} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="h-10 mt-1" required />
              </div>
            </div>
            <div className="col-span-1 md:col-span-2">
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 min-h-[80px]" placeholder="Additional notes or comments..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editId ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice {viewInvoice?.invoiceNumber}</DialogTitle>
            <DialogDescription>View the full invoice details below.</DialogDescription>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-xs text-muted-foreground">Customer:</span><p className="font-medium">{viewInvoice.customer ? `${viewInvoice.customer.firstName} ${viewInvoice.customer.lastName}` : 'N/A'}</p></div>
                <div><span className="text-xs text-muted-foreground">Status:</span><p><Badge className={`text-[10px] ${statusColors[viewInvoice.status] || ''}`}>{viewInvoice.status}</Badge></p></div>
                <div><span className="text-xs text-muted-foreground">Type:</span><p className="capitalize">{viewInvoice.type || '—'}</p></div>
                <div><span className="text-xs text-muted-foreground">Due Date:</span><p>{viewInvoice.dueDate ? new Date(viewInvoice.dueDate).toLocaleDateString() : 'N/A'}</p></div>
              </div>
              {(viewInvoice.items && viewInvoice.items.length > 0) && (
                <div>
                  <p className="text-xs font-medium mb-2">Line Items</p>
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="text-[10px]">Description</TableHead>
                      <TableHead className="text-[10px]">Qty</TableHead>
                      <TableHead className="text-[10px]">Price</TableHead>
                      <TableHead className="text-[10px]">Total</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {viewInvoice.items.map((it: any) => (
                        <TableRow key={it.id}>
                          <TableCell className="text-xs">{it.description}</TableCell>
                          <TableCell className="text-xs">{it.quantity}</TableCell>
                          <TableCell className="text-xs">{fmt(it.unitPrice)}</TableCell>
                          <TableCell className="text-xs font-medium">{fmt(it.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                <div><span className="text-xs text-muted-foreground">Subtotal</span><p className="font-medium">{fmt(viewInvoice.subtotal ?? 0)}</p></div>
                <div><span className="text-xs text-muted-foreground">Tax</span><p className="font-medium">{fmt(viewInvoice.taxAmount ?? 0)}</p></div>
                <div><span className="text-xs text-muted-foreground">Total</span><p className="font-bold">{fmt(viewInvoice.totalAmount)}</p></div>
              </div>
              {viewInvoice.notes && (
                <div><span className="text-xs text-muted-foreground">Notes:</span><p className="text-sm">{viewInvoice.notes}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
