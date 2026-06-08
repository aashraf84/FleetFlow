'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Award, Plus, Star, Send, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function HrPerformancePage() {
  const [records, setRecords] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>({})

  const fetchData = async () => {
    setLoading(true)
    try {
      const [perfRes, empRes] = await Promise.all([
        fetch('/api/fleet/hr/performance'),
        fetch('/api/fleet/hr'),
      ])
      if (perfRes.ok) { const j = await perfRes.json(); setRecords(j.data || []) }
      if (empRes.ok) { const j = await empRes.json(); setEmployees(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => {
    setForm({
      employeeId: '',
      reviewer: '',
      period: '',
      rating: '3',
      goals: '',
      feedback: '',
      strengths: '',
      improvements: '',
      reviewDate: new Date().toISOString().split('T')[0],
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/fleet/hr/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Performance review created')
        fetchData()
        setOpen(false)
        setForm({})
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed')
      }
    } catch (e) { toast.error('Failed') }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/fleet/hr/performance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) {
        toast.success(`Review ${status}`)
        fetchData()
      } else {
        toast.error('Failed to update')
      }
    } catch (e) { toast.error('Failed') }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'acknowledged': return 'bg-emerald-100 text-emerald-800'
      case 'submitted': return 'bg-sky-100 text-sky-800'
      default: return 'bg-amber-100 text-amber-800'
    }
  }

  const ratingBadge = (rating: number) => {
    if (rating >= 4) return 'bg-emerald-100 text-emerald-800'
    if (rating >= 3) return 'bg-amber-100 text-amber-800'
    return 'bg-red-100 text-red-800'
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-3 w-3 ${i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Performance Reviews</h2><p className="text-sm text-muted-foreground">Employee performance tracking and evaluations</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Review</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Reviews', value: records.length },
          { label: 'Avg Rating', value: records.length > 0 ? (records.reduce((s: number, r: any) => s + (r.rating || 0), 0) / records.length).toFixed(1) : '0' },
          { label: 'Top Performers', value: records.filter((r: any) => r.rating >= 4.5).length },
          { label: 'Needs Improvement', value: records.filter((r: any) => r.rating < 3).length },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Employee</TableHead><TableHead className="text-xs">Reviewer</TableHead><TableHead className="text-xs">Period</TableHead>
            <TableHead className="text-xs">Rating</TableHead><TableHead className="text-xs">Goals</TableHead><TableHead className="text-xs">Feedback</TableHead>
            <TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow> :
            records.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No performance reviews</TableCell></TableRow> :
            records.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs font-medium">{r.employee?.firstName} {r.employee?.lastName}</TableCell>
                <TableCell className="text-xs">{r.reviewer}</TableCell>
                <TableCell className="text-xs">{r.period}</TableCell>
                <TableCell className="text-xs"><div className="flex items-center gap-1">{renderStars(r.rating)}<span className="ml-1">{r.rating}/5</span></div></TableCell>
                <TableCell className="text-xs max-w-32 truncate">{r.goals || 'N/A'}</TableCell>
                <TableCell className="text-xs max-w-32 truncate">{r.feedback || 'N/A'}</TableCell>
                <TableCell><Badge className={`text-[10px] ${statusColor(r.status)}`}>{r.status}</Badge></TableCell>
                <TableCell>
                  {r.status === 'draft' && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateStatus(r.id, 'submitted')}><Send className="h-3 w-3 mr-1" />Submit</Button>
                  )}
                  {r.status === 'submitted' && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600" onClick={() => updateStatus(r.id, 'acknowledged')}><CheckCircle className="h-3 w-3 mr-1" />Acknowledge</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>New Performance Review</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2"><Label className="text-xs">Employee</Label>
              <Select value={form.employeeId || ''} onValueChange={v => setForm({ ...form, employeeId: v })}>
                <SelectTrigger className="h-9 mt-1"><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Reviewer</Label><Input value={form.reviewer || ''} onChange={e => setForm({ ...form, reviewer: e.target.value })} className="h-9 mt-1" placeholder="Reviewer name" /></div>
            <div><Label className="text-xs">Period</Label><Input value={form.period || ''} onChange={e => setForm({ ...form, period: e.target.value })} className="h-9 mt-1" placeholder="e.g. 2024-Q1" /></div>
            <div><Label className="text-xs">Rating (1-5)</Label>
              <Select value={form.rating || '3'} onValueChange={v => setForm({ ...form, rating: v })}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Needs Improvement</SelectItem>
                  <SelectItem value="2">2 - Below Expectations</SelectItem>
                  <SelectItem value="3">3 - Meets Expectations</SelectItem>
                  <SelectItem value="4">4 - Exceeds Expectations</SelectItem>
                  <SelectItem value="5">5 - Outstanding</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Review Date</Label><Input type="date" value={form.reviewDate || ''} onChange={e => setForm({ ...form, reviewDate: e.target.value })} className="h-9 mt-1" /></div>
            <div className="col-span-2"><Label className="text-xs">Goals</Label><Input value={form.goals || ''} onChange={e => setForm({ ...form, goals: e.target.value })} className="h-9 mt-1" placeholder="Employee goals" /></div>
            <div className="col-span-2"><Label className="text-xs">Feedback</Label><Input value={form.feedback || ''} onChange={e => setForm({ ...form, feedback: e.target.value })} className="h-9 mt-1" placeholder="General feedback" /></div>
            <div className="col-span-2"><Label className="text-xs">Strengths</Label><Input value={form.strengths || ''} onChange={e => setForm({ ...form, strengths: e.target.value })} className="h-9 mt-1" placeholder="Key strengths" /></div>
            <div className="col-span-2"><Label className="text-xs">Areas for Improvement</Label><Input value={form.improvements || ''} onChange={e => setForm({ ...form, improvements: e.target.value })} className="h-9 mt-1" placeholder="Areas to improve" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Create Review</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
