'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Award, Plus, Star, BarChart3, Send, CheckCircle, Loader2, TrendingUp, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function HrPerformancePage() {
  const [records, setRecords] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

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
    setSaving(true)
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
    } catch (e) { toast.error('Failed') } finally { setSaving(false) }
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

  const statCards = [
    { label: 'Total Reviews', value: records.length, icon: Award, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Avg Rating', value: records.length > 0 ? (records.reduce((s: number, r: any) => s + (r.rating || 0), 0) / records.length).toFixed(1) : '0', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Top Performers', value: records.filter((r: any) => r.rating >= 4.5).length, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Needs Improvement', value: records.filter((r: any) => r.rating < 3).length, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div><CardTitle className="text-2xl">Performance Reviews</CardTitle><p className="text-sm text-muted-foreground">Employee performance tracking and evaluations</p></div>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Review</Button>
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
            <TableHead className="text-xs">Employee</TableHead><TableHead className="text-xs hidden md:table-cell">Reviewer</TableHead><TableHead className="text-xs hidden md:table-cell">Period</TableHead>
            <TableHead className="text-xs">Rating</TableHead><TableHead className="text-xs hidden lg:table-cell">Goals</TableHead><TableHead className="text-xs hidden lg:table-cell">Feedback</TableHead>
            <TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow> :
            records.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No performance reviews</TableCell></TableRow> :
            records.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs font-medium">{r.employee?.firstName} {r.employee?.lastName}</TableCell>
                <TableCell className="text-xs hidden md:table-cell">{r.reviewer}</TableCell>
                <TableCell className="text-xs hidden md:table-cell">{r.period}</TableCell>
                <TableCell className="text-xs"><div className="flex items-center gap-1">{renderStars(r.rating)}<span className="ml-1">{r.rating}/5</span></div></TableCell>
                <TableCell className="text-xs max-w-32 truncate hidden lg:table-cell">{r.goals || 'N/A'}</TableCell>
                <TableCell className="text-xs max-w-32 truncate hidden lg:table-cell">{r.feedback || 'N/A'}</TableCell>
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

      <Dialog open={open} onOpenChange={(v) => { if (!saving) setOpen(v) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>New Performance Review</DialogTitle><DialogDescription>Create a performance review for an employee.</DialogDescription></DialogHeader>
          <div className="space-y-6 py-2">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Star className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Review Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Employee <span className="text-destructive">*</span></Label>
                  <Select required value={form.employeeId || ''} onValueChange={v => setForm({ ...form, employeeId: v })}>
                    <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select an employee" /></SelectTrigger>
                    <SelectContent>
                      {employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs font-medium text-muted-foreground">Reviewer <span className="text-destructive">*</span></Label><Input required value={form.reviewer || ''} onChange={e => setForm({ ...form, reviewer: e.target.value })} className="h-10 mt-1" placeholder="Reviewer name" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Period <span className="text-destructive">*</span></Label><Input required value={form.period || ''} onChange={e => setForm({ ...form, period: e.target.value })} className="h-10 mt-1" placeholder="e.g. 2024-Q1" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Review Date</Label><Input type="date" value={form.reviewDate || ''} onChange={e => setForm({ ...form, reviewDate: e.target.value })} className="h-10 mt-1" placeholder="Select date" /></div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Evaluation</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Rating (1-5) <span className="text-destructive">*</span></Label>
                  <Select required value={form.rating || '3'} onValueChange={v => setForm({ ...form, rating: v })}>
                    <SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select rating" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Needs Improvement</SelectItem>
                      <SelectItem value="2">2 - Below Expectations</SelectItem>
                      <SelectItem value="3">3 - Meets Expectations</SelectItem>
                      <SelectItem value="4">4 - Exceeds Expectations</SelectItem>
                      <SelectItem value="5">5 - Outstanding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 md:col-span-3"><Label className="text-xs font-medium text-muted-foreground">Goals</Label><Textarea value={form.goals || ''} onChange={e => setForm({ ...form, goals: e.target.value })} className="min-h-[80px] mt-1" placeholder="Employee goals and objectives" /></div>
                <div className="col-span-1 md:col-span-3"><Label className="text-xs font-medium text-muted-foreground">Feedback</Label><Textarea value={form.feedback || ''} onChange={e => setForm({ ...form, feedback: e.target.value })} className="min-h-[80px] mt-1" placeholder="General performance feedback" /></div>
                <div className="col-span-1 md:col-span-3"><Label className="text-xs font-medium text-muted-foreground">Strengths</Label><Textarea value={form.strengths || ''} onChange={e => setForm({ ...form, strengths: e.target.value })} className="min-h-[80px] mt-1" placeholder="Key strengths demonstrated" /></div>
                <div className="col-span-1 md:col-span-3"><Label className="text-xs font-medium text-muted-foreground">Areas for Improvement</Label><Textarea value={form.improvements || ''} onChange={e => setForm({ ...form, improvements: e.target.value })} className="min-h-[80px] mt-1" placeholder="Areas where improvement is needed" /></div>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Create Review</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
