'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Palmtree, Plus, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function HrLeavePage() {
  const [records, setRecords] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [leaveRes, empRes] = await Promise.all([
        fetch('/api/fleet/hr/leave'),
        fetch('/api/fleet/hr'),
      ])
      if (leaveRes.ok) { const j = await leaveRes.json(); setRecords(j.data || []) }
      if (empRes.ok) { const j = await empRes.json(); setEmployees(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => {
    setForm({ employeeId: '', type: 'annual', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], reason: '' })
    setOpen(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/fleet/hr/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Leave request submitted')
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
      const res = await fetch('/api/fleet/hr/leave', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        toast.success(`Leave ${status}`)
        fetchData()
      } else {
        toast.error('Failed to update')
      }
    } catch (e) { toast.error('Failed') }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'approved': return 'bg-emerald-100 text-emerald-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-amber-100 text-amber-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Leave Management</h2><p className="text-sm text-muted-foreground">Track and manage employee leave requests</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Request Leave</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Requests', value: records.length },
          { label: 'Pending', value: records.filter(l => l.status === 'pending').length },
          { label: 'Approved', value: records.filter(l => l.status === 'approved').length },
          { label: 'On Leave Now', value: records.filter(l => l.status === 'approved' && new Date(l.startDate) <= new Date() && new Date(l.endDate) >= new Date()).length },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Employee</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Start</TableHead>
            <TableHead className="text-xs">End</TableHead><TableHead className="text-xs">Days</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Reason</TableHead><TableHead className="text-xs">Actions</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow> :
            records.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No leave records</TableCell></TableRow> :
            records.map((l: any) => (
              <TableRow key={l.id}>
                <TableCell className="text-xs font-medium">{l.employee?.firstName} {l.employee?.lastName}</TableCell>
                <TableCell className="text-xs capitalize">{l.type}</TableCell>
                <TableCell className="text-xs">{new Date(l.startDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-xs">{new Date(l.endDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-xs">{l.days}</TableCell>
                <TableCell><Badge className={`text-[10px] ${statusColor(l.status)}`}>{l.status}</Badge></TableCell>
                <TableCell className="text-xs max-w-32 truncate">{l.reason || 'N/A'}</TableCell>
                <TableCell>
                  {l.status === 'pending' && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={() => updateStatus(l.id, 'approved')} title="Approve"><CheckCircle className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => updateStatus(l.id, 'rejected')} title="Reject"><XCircle className="h-3.5 w-3.5" /></Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={(v) => { if (!saving) setOpen(v) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Request Leave</DialogTitle><DialogDescription>Submit a new leave request for an employee.</DialogDescription></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="col-span-1 md:col-span-2"><Label className="text-xs">Employee <span className="text-destructive">*</span></Label>
              <Select required value={form.employeeId || ''} onValueChange={v => setForm({ ...form, employeeId: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select an employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Leave Type <span className="text-destructive">*</span></Label>
              <Select required value={form.type || 'annual'} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select leave type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="sick">Sick</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="maternity">Maternity</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div></div>
            <div><Label className="text-xs">Start Date <span className="text-destructive">*</span></Label><Input required type="date" value={form.startDate || ''} onChange={e => setForm({ ...form, startDate: e.target.value })} className="h-10 mt-1" placeholder="Leave start date" /></div>
            <div><Label className="text-xs">End Date <span className="text-destructive">*</span></Label><Input required type="date" value={form.endDate || ''} onChange={e => setForm({ ...form, endDate: e.target.value })} className="h-10 mt-1" placeholder="Leave end date" /></div>
            <div className="col-span-1 md:col-span-2"><Label className="text-xs">Reason <span className="text-destructive">*</span></Label><Textarea required value={form.reason || ''} onChange={e => setForm({ ...form, reason: e.target.value })} className="min-h-[80px] mt-1" placeholder="Provide a reason for the leave request" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Submit Request</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
