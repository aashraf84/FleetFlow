'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Clock, Timer, FileText, Plus, Edit, Loader2, ClipboardList, UserCheck, UserX } from 'lucide-react'
import { toast } from 'sonner'

export default function HrAttendancePage() {
  const [records, setRecords] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [attRes, empRes] = await Promise.all([
        fetch('/api/fleet/hr/attendance'),
        fetch('/api/fleet/hr'),
      ])
      if (attRes.ok) { const j = await attRes.json(); setRecords(j.data || []) }
      if (empRes.ok) { const j = await empRes.json(); setEmployees(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => {
    setEditItem(null)
    setForm({ employeeId: '', date: new Date().toISOString().split('T')[0], checkIn: '', checkOut: '', status: 'present', notes: '' })
    setOpen(true)
  }

  const openEdit = (item: any) => {
    setEditItem(item)
    setForm({
      id: item.id,
      employeeId: item.employeeId,
      date: new Date(item.date).toISOString().split('T')[0],
      checkIn: item.checkIn ? new Date(item.checkIn).toISOString().slice(0, 16) : '',
      checkOut: item.checkOut ? new Date(item.checkOut).toISOString().slice(0, 16) : '',
      status: item.status,
      notes: item.notes || '',
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const payload = { ...form }
      if (payload.checkIn) payload.checkIn = new Date(payload.checkIn).toISOString()
      if (payload.checkOut) payload.checkOut = new Date(payload.checkOut).toISOString()

      const res = editItem
        ? await fetch('/api/fleet/hr/attendance', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/fleet/hr/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })

      if (res.ok) {
        toast.success(editItem ? 'Attendance updated' : 'Attendance recorded')
        fetchData()
        setOpen(false)
        setEditItem(null)
        setForm({})
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed')
      }
    } catch (e) { toast.error('Failed') } finally { setSaving(false) }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'present': return 'bg-emerald-100 text-emerald-800'
      case 'late': return 'bg-amber-100 text-amber-800'
      case 'absent': return 'bg-red-100 text-red-800'
      case 'half_day': return 'bg-sky-100 text-sky-800'
      case 'leave': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const statCards = [
    { label: 'Total Records', value: records.length, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Present', value: records.filter(a => a.status === 'present').length, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Late', value: records.filter(a => a.status === 'late').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Absent', value: records.filter(a => a.status === 'absent').length, icon: UserX, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div><CardTitle className="text-2xl">Attendance</CardTitle><p className="text-sm text-muted-foreground">Track employee attendance and hours</p></div>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Record Attendance</Button>
          </div>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(s => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                <div className={`p-1.5 rounded-md ${s.bg}`}><s.icon className={`h-3.5 w-3.5 ${s.color}`} /></div>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[440px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Employee</TableHead><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs hidden md:table-cell">Check In</TableHead>
            <TableHead className="text-xs hidden md:table-cell">Check Out</TableHead><TableHead className="text-xs hidden lg:table-cell">Hours</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
            records.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No attendance records</TableCell></TableRow> :
            records.map((a: any) => (
              <TableRow key={a.id}>
                <TableCell className="text-xs font-medium">{a.employee?.firstName} {a.employee?.lastName}</TableCell>
                <TableCell className="text-xs">{new Date(a.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-xs hidden md:table-cell">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : 'N/A'}</TableCell>
                <TableCell className="text-xs hidden md:table-cell">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : 'N/A'}</TableCell>
                <TableCell className="text-xs hidden lg:table-cell">{a.hoursWorked}h</TableCell>
                <TableCell><Badge className={`text-[10px] ${statusColor(a.status)}`}>{a.status?.replace('_', ' ')}</Badge></TableCell>
                <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}><Edit className="h-3.5 w-3.5" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={(v) => { if (!saving) setOpen(v) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editItem ? 'Edit Attendance' : 'Record Attendance'}</DialogTitle><DialogDescription>{editItem ? 'Update attendance record details.' : 'Record a new attendance entry for an employee.'}</DialogDescription></DialogHeader>
          <div className="space-y-6 py-2">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Attendance Record</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Employee <span className="text-destructive">*</span></Label>
                  <Select required value={form.employeeId || ''} onValueChange={v => setForm({ ...form, employeeId: v })} disabled={!!editItem}>
                    <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select an employee" /></SelectTrigger>
                    <SelectContent>
                      {employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs font-medium text-muted-foreground">Date <span className="text-destructive">*</span></Label><Input required type="date" value={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} className="h-10 mt-1" placeholder="Select date" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Status <span className="text-destructive">*</span></Label>
                  <Select required value={form.status || 'present'} onValueChange={v => setForm({ ...form, status: v })}>
                    <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="half_day">Half Day</SelectItem>
                      <SelectItem value="leave">Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Timer className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Time Tracking</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Check In</Label><Input type="datetime-local" value={form.checkIn || ''} onChange={e => setForm({ ...form, checkIn: e.target.value })} className="h-10 mt-1" placeholder="Check-in time" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Check Out</Label><Input type="datetime-local" value={form.checkOut || ''} onChange={e => setForm({ ...form, checkOut: e.target.value })} className="h-10 mt-1" placeholder="Check-out time" /></div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Additional</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-3"><Label className="text-xs font-medium text-muted-foreground">Notes</Label><Textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="min-h-[80px] mt-1" placeholder="Any additional notes about this attendance record" /></div>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editItem ? 'Update' : 'Record'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
