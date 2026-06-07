'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Clock, Plus } from 'lucide-react'
import { toast } from 'sonner'

export default function HrAttendancePage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try { const res = await fetch('/api/fleet/hr?XTransformPort=3000'); if (res.ok) { const j = await res.json(); setEmployees(j.data || []) } } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const today = new Date().toLocaleDateString()
  const attendanceRecords = employees.flatMap(e => (e.attendance || []).map((a: any) => ({ ...a, employee: e })))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Attendance</h2><p className="text-sm text-muted-foreground">Track employee attendance and hours</p></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: employees.length },
          { label: 'Present Today', value: attendanceRecords.filter(a => a.status === 'present').length },
          { label: 'Late Today', value: attendanceRecords.filter(a => a.status === 'late').length },
          { label: 'Absent Today', value: attendanceRecords.filter(a => a.status === 'absent').length },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Employee</TableHead><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Check In</TableHead>
            <TableHead className="text-xs">Check Out</TableHead><TableHead className="text-xs">Hours</TableHead><TableHead className="text-xs">Status</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow> :
            attendanceRecords.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No attendance records. Attendance is tracked per employee.</TableCell></TableRow> :
            attendanceRecords.map((a: any) => (
              <TableRow key={a.id}>
                <TableCell className="text-xs font-medium">{a.employee?.firstName} {a.employee?.lastName}</TableCell>
                <TableCell className="text-xs">{new Date(a.date).toLocaleDateString()}</TableCell>
                <TableCell className="text-xs">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : 'N/A'}</TableCell>
                <TableCell className="text-xs">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : 'N/A'}</TableCell>
                <TableCell className="text-xs">{a.hoursWorked}h</TableCell>
                <TableCell><Badge className={`text-[10px] ${a.status === 'present' ? 'bg-emerald-100 text-emerald-800' : a.status === 'late' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>{a.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>
    </div>
  )
}
