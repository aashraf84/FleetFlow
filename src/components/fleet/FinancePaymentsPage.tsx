'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DollarSign } from 'lucide-react'

export default function FinancePaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try { const res = await fetch('/api/fleet/finance/payments?XTransformPort=3000'); if (res.ok) { const j = await res.json(); setPayments(j.data || []) } } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Payments</h2><p className="text-sm text-muted-foreground">Track all payment transactions</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Payments', value: payments.length },
          { label: 'Completed', value: fmt(payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0)) },
          { label: 'Pending', value: fmt(payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)) },
          { label: 'Cash', value: payments.filter(p => p.method === 'cash').length },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Invoice</TableHead><TableHead className="text-xs">Amount</TableHead><TableHead className="text-xs">Method</TableHead>
            <TableHead className="text-xs">Reference</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Date</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow> :
            payments.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payments recorded. Payments are created when invoices are paid.</TableCell></TableRow> :
            payments.map(p => (
              <TableRow key={p.id}>
                <TableCell className="text-xs font-mono">{p.invoice?.invoiceNumber || 'N/A'}</TableCell>
                <TableCell className="text-xs font-medium">{fmt(p.amount)}</TableCell>
                <TableCell className="text-xs capitalize">{p.method?.replace('_', ' ')}</TableCell>
                <TableCell className="text-xs">{p.reference || 'N/A'}</TableCell>
                <TableCell><Badge className={`text-[10px] ${p.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{p.status}</Badge></TableCell>
                <TableCell className="text-xs">{new Date(p.paidDate).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>
    </div>
  )
}
