'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BookOpen, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function FinanceAccountingPage() {
  const [data, setData] = useState<any>({ entries: [], totalDebit: 0, totalCredit: 0, balance: 0 })
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try { const res = await fetch('/api/fleet/finance/accounting'); if (res.ok) { const j = await res.json(); setData(j.data || { entries: [], totalDebit: 0, totalCredit: 0, balance: 0 }) } } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/fleet/finance/accounting', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, status: 'draft' }) })
      if (res.ok) { toast.success('Journal entry created'); fetchData(); setOpen(false); setForm({}) }
      else toast.error('Failed')
    } catch (e) { toast.error('Failed') }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Accounting</h2><p className="text-sm text-muted-foreground">General ledger, journal entries, and financial statements</p></div>
        <Button onClick={() => { setForm({ amount: 0 }); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />New Entry</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Entries', value: data.entries?.length || 0 },
          { label: 'Total Debit', value: fmt(data.totalDebit) },
          { label: 'Total Credit', value: fmt(data.totalCredit) },
          { label: 'Balance', value: fmt(data.balance) },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Profit & Loss</p><p className="text-lg font-bold">{fmt(data.totalDebit - data.totalCredit)}</p><p className="text-xs text-muted-foreground mt-1">Revenue minus expenses</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Cash Flow</p><p className="text-lg font-bold">{fmt(data.totalCredit)}</p><p className="text-xs text-muted-foreground mt-1">Total incoming</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground mb-1">Balance Sheet</p><p className="text-lg font-bold">{fmt(data.totalDebit)}</p><p className="text-xs text-muted-foreground mt-1">Total assets</p></CardContent></Card>
      </div>

      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Entry #</TableHead><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Debit Account</TableHead>
            <TableHead className="text-xs">Credit Account</TableHead><TableHead className="text-xs">Amount</TableHead><TableHead className="text-xs">Description</TableHead><TableHead className="text-xs">Status</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
            (data.entries || []).length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No journal entries</TableCell></TableRow> :
            data.entries.map((e: any) => (
              <TableRow key={e.id}>
                <TableCell className="text-xs font-mono">{e.entryNumber}</TableCell>
                <TableCell className="text-xs">{new Date(e.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-xs">{e.debitAccount}</TableCell>
                <TableCell className="text-xs">{e.creditAccount}</TableCell>
                <TableCell className="text-xs font-medium">{fmt(e.amount)}</TableCell>
                <TableCell className="text-xs max-w-32 truncate">{e.description || 'N/A'}</TableCell>
                <TableCell><Badge variant={e.status === 'posted' ? 'default' : 'outline'} className="text-[10px]">{e.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Journal Entry</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label className="text-xs">Debit Account</Label><Input value={form.debitAccount || ''} onChange={e => setForm({...form, debitAccount: e.target.value})} className="h-9 mt-1" placeholder="e.g., Cash, Accounts Receivable" /></div>
            <div><Label className="text-xs">Credit Account</Label><Input value={form.creditAccount || ''} onChange={e => setForm({...form, creditAccount: e.target.value})} className="h-9 mt-1" placeholder="e.g., Revenue, Accounts Payable" /></div>
            <div><Label className="text-xs">Amount ($)</Label><Input type="number" value={form.amount || ''} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Description</Label><Input value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="h-9 mt-1" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
