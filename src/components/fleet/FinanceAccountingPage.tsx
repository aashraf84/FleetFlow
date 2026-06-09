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
  Plus, Pencil, Trash2, MoreHorizontal, BookOpen, DollarSign, FileText, CheckCircle2, Ban, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  posted: 'bg-emerald-100 text-emerald-800',
  void: 'bg-red-100 text-red-800',
}

const emptyForm = {
  debitAccount: '', creditAccount: '', amount: 0, description: '',
  type: 'debit', account: '', reference: '',
  date: new Date().toISOString().split('T')[0],
}

export default function FinanceAccountingPage() {
  const [data, setData] = useState<any>({ entries: [], totalDebit: 0, totalCredit: 0, balance: 0 })
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fleet/finance/accounting')
      if (res.ok) { const j = await res.json(); setData(j.data || { entries: [], totalDebit: 0, totalCredit: 0, balance: 0 }) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditId(null)
    setForm({ ...emptyForm })
    setOpen(true)
  }

  const openEdit = (entry: any) => {
    setEditId(entry.id)
    setForm({
      debitAccount: entry.debitAccount || entry.account || '',
      creditAccount: entry.creditAccount || '',
      amount: entry.amount || 0,
      description: entry.description || '',
      type: entry.type || 'debit',
      account: entry.account || '',
      reference: entry.reference || '',
      date: entry.date ? new Date(entry.date).toISOString().split('T')[0] : '',
      status: entry.status,
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      if (editId) {
        const res = await fetch('/api/fleet/finance/accounting', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...form }),
        })
        if (res.ok) { toast.success('Journal entry updated'); fetchData(); setOpen(false); setEditId(null); setForm(emptyForm) }
        else toast.error('Failed to update journal entry')
      } else {
        const res = await fetch('/api/fleet/finance/accounting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, status: 'draft' }),
        })
        if (res.ok) { toast.success('Journal entry created'); fetchData(); setOpen(false); setForm(emptyForm) }
        else toast.error('Failed to create journal entry')
      }
    } catch (e) { toast.error('Failed') } finally { setSaving(false) }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/fleet/finance/accounting', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        toast.success(`Journal entry ${status === 'posted' ? 'posted' : 'voided'}`)
        fetchData()
      } else toast.error('Failed to update status')
    } catch (e) { toast.error('Failed') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this journal entry? Only draft entries can be deleted.')) return
    try {
      const res = await fetch(`/api/fleet/finance/accounting?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Journal entry deleted'); fetchData() }
      else toast.error('Failed to delete journal entry')
    } catch (e) { toast.error('Failed') }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Accounting</h2>
          <p className="text-sm text-muted-foreground">General ledger, journal entries, and financial statements</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Entry</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Entries', value: data.entries?.length || 0 },
          { label: 'Total Debit', value: fmt(data.totalDebit) },
          { label: 'Total Credit', value: fmt(data.totalCredit) },
          { label: 'Balance', value: fmt(data.balance) },
        ].map(s => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Profit & Loss</p><p className="text-lg font-bold">{fmt(data.totalDebit - data.totalCredit)}</p><p className="text-xs text-muted-foreground mt-1">Revenue minus expenses</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Cash Flow</p><p className="text-lg font-bold">{fmt(data.totalCredit)}</p><p className="text-xs text-muted-foreground mt-1">Total incoming</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Balance Sheet</p><p className="text-lg font-bold">{fmt(data.totalDebit)}</p><p className="text-xs text-muted-foreground mt-1">Total assets</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs">Entry #</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
              <TableHead className="text-xs">Debit Account</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Credit Account</TableHead>
              <TableHead className="text-xs">Amount</TableHead>
              <TableHead className="text-xs hidden lg:table-cell">Description</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : (data.entries || []).length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No journal entries</TableCell></TableRow>
              ) : (
                data.entries.map((e: any) => (
                  <TableRow key={e.id} className="hover:bg-accent/50">
                    <TableCell className="text-xs font-mono">{e.entryNumber}</TableCell>
                    <TableCell className="text-xs hidden md:table-cell">{new Date(e.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs">{e.debitAccount || e.account || '—'}</TableCell>
                    <TableCell className="text-xs hidden md:table-cell">{e.creditAccount || '—'}</TableCell>
                    <TableCell className="text-xs font-medium">{fmt(e.amount)}</TableCell>
                    <TableCell className="text-xs max-w-32 truncate hidden lg:table-cell">{e.description || 'N/A'}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${statusColors[e.status] || ''}`}>{e.status}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {e.status === 'draft' && (
                            <DropdownMenuItem onClick={() => openEdit(e)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                            </DropdownMenuItem>
                          )}
                          {e.status === 'draft' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(e.id, 'posted')}>
                              <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Post
                            </DropdownMenuItem>
                          )}
                          {(e.status === 'draft' || e.status === 'posted') && (
                            <DropdownMenuItem onClick={() => handleStatusChange(e.id, 'void')}>
                              <Ban className="mr-2 h-3.5 w-3.5" /> Void
                            </DropdownMenuItem>
                          )}
                          {e.status === 'draft' && (
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(e.id)}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          )}
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
            <DialogTitle>{editId ? 'Edit Journal Entry' : 'New Journal Entry'}</DialogTitle>
            <DialogDescription>{editId ? 'Modify the journal entry details below.' : 'Fill in the details to create a new journal entry.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Entry Details */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Entry Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Date <span className="text-destructive">*</span></Label>
                  <Input type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} className="h-10 mt-1" required />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Reference</Label>
                  <Input value={form.reference || ''} onChange={e => setForm({ ...form, reference: e.target.value })} className="h-10 mt-1" placeholder="Optional reference number" />
                </div>
                {editId && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                    <Select value={form.status || 'draft'} onValueChange={v => setForm({ ...form, status: v })}>
                      <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="posted">Posted</SelectItem>
                        <SelectItem value="void">Void</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Account */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <DollarSign className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Account</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Debit Account <span className="text-destructive">*</span></Label>
                  <Input value={form.debitAccount || ''} onChange={e => setForm({ ...form, debitAccount: e.target.value })} className="h-10 mt-1" placeholder="e.g., Cash, Accounts Receivable" required />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Credit Account <span className="text-destructive">*</span></Label>
                  <Input value={form.creditAccount || ''} onChange={e => setForm({ ...form, creditAccount: e.target.value })} className="h-10 mt-1" placeholder="e.g., Revenue, Accounts Payable" required />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Type</Label>
                  <Select value={form.type || 'debit'} onValueChange={v => setForm({ ...form, type: v })}>
                    <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select entry type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debit">Debit</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Amount ($) <span className="text-destructive">*</span></Label>
                  <Input type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} className="h-10 mt-1" placeholder="0.00" required />
                </div>
              </div>
            </div>

            {/* Additional */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Additional</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <Label className="text-xs font-medium text-muted-foreground">Description</Label>
                  <Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 min-h-[80px]" placeholder="Describe the journal entry..." rows={3} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editId ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
