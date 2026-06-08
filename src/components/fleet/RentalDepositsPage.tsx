'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Wallet, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function RentalDepositsPage() {
  const [deposits, setDeposits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [contracts, setContracts] = useState<any[]>([])
  const [form, setForm] = useState<any>({})

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [depRes, conRes] = await Promise.all([
        fetch('/api/fleet/deposits'),
        fetch('/api/fleet/rentals')
      ])
      if (depRes.ok) { const j = await depRes.json(); setDeposits(j.data || []) }
      if (conRes.ok) { const j = await conRes.json(); setContracts(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/fleet/deposits', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      })
      if (res.ok) { toast.success('Deposit recorded'); fetchData(); setOpen(false); setForm({}) }
      else toast.error('Failed')
    } catch (e) { toast.error('Request failed') }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`
  const stats = [
    { label: 'Total Deposits', value: deposits.length },
    { label: 'Collected', value: fmt(deposits.filter(d => d.type === 'collection').reduce((s, d) => s + d.amount, 0)) },
    { label: 'Refunded', value: fmt(deposits.filter(d => d.type === 'refund').reduce((s, d) => s + d.amount, 0)) },
    { label: 'Deductions', value: fmt(deposits.filter(d => d.type === 'deduction').reduce((s, d) => s + d.amount, 0)) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Deposit Management</h2><p className="text-sm text-muted-foreground">Track deposits, refunds, and deductions</p></div>
        <Button onClick={() => { setForm({ type: 'collection', method: 'cash', amount: 0, status: 'collected' }); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />Record Deposit</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Contract</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Method</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Reason</TableHead>
                <TableHead className="text-xs">Date</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow> :
                deposits.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No deposits recorded</TableCell></TableRow> :
                deposits.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="text-xs font-mono">{d.contract?.contractNumber || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{d.contract?.customer ? `${d.contract.customer.firstName} ${d.contract.customer.lastName}` : 'N/A'}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] capitalize">{d.type}</Badge></TableCell>
                    <TableCell className="text-xs font-medium">{fmt(d.amount)}</TableCell>
                    <TableCell className="text-xs capitalize">{d.method}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${d.status === 'collected' ? 'bg-emerald-100 text-emerald-800' : d.status === 'refunded' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{d.status?.replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="text-xs max-w-32 truncate">{d.reason || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Deposit</DialogTitle><DialogDescription>Record a deposit collection, refund, or deduction for a rental contract.</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="col-span-1 md:col-span-2"><Label>Contract *</Label><Select value={form.contractId || ''} onValueChange={v => setForm({...form, contractId: v})}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select contract" /></SelectTrigger><SelectContent>{contracts.map(c => <SelectItem key={c.id} value={c.id}>{c.contractNumber} - {c.customer ? `${c.customer.firstName} ${c.customer.lastName}` : 'N/A'}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Type</Label><Select value={form.type || 'collection'} onValueChange={v => setForm({...form, type: v})}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="collection">Collection</SelectItem><SelectItem value="refund">Refund</SelectItem><SelectItem value="adjustment">Adjustment</SelectItem><SelectItem value="deduction">Deduction</SelectItem></SelectContent></Select></div>
            <div><Label>Method</Label><Select value={form.method || 'cash'} onValueChange={v => setForm({...form, method: v})}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select method" /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="card">Card</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="check">Check</SelectItem></SelectContent></Select></div>
            <div><Label>Amount ($) *</Label><Input type="number" value={form.amount || ''} onChange={e => setForm({...form, amount: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="0.00" required /></div>
            <div><Label>Reason</Label><Input value={form.reason || ''} onChange={e => setForm({...form, reason: e.target.value})} className="h-10 mt-1" placeholder="Reason for deposit or deduction" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Record</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
