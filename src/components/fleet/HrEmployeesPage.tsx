'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { UserCog, Plus, Search, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function HrEmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState<any>({})

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try { const res = await fetch('/api/fleet/hr'); if (res.ok) { const j = await res.json(); setEmployees(j.data || []) } } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    try {
      const url = '/api/fleet/hr'
      const res = editItem
        ? await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editItem.id, ...form }) })
        : await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { toast.success(editItem ? 'Updated' : 'Created'); fetchData(); setOpen(false); setEditItem(null); setForm({}) }
    } catch (e) { toast.error('Failed') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return
    try { const res = await fetch(`/api/fleet/hr?id=${id}`, { method: 'DELETE' }); if (res.ok) { toast.success('Deleted'); fetchData() } } catch (e) { toast.error('Failed') }
  }

  const openCreate = () => { setEditItem(null); setForm({ firstName: '', lastName: '', email: '', status: 'active', baseSalary: 0 }); setOpen(true) }
  const openEdit = (item: any) => { setEditItem(item); setForm(item); setOpen(true) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Employees</h2><p className="text-sm text-muted-foreground">Manage employee records and data</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Employee</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: employees.length },
          { label: 'Active', value: employees.filter(e => e.status === 'active').length },
          { label: 'On Leave', value: employees.filter(e => e.status === 'on_leave').length },
          { label: 'Departments', value: new Set(employees.map(e => e.department).filter(Boolean)).size },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card><CardHeader className="pb-3"><div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" /></div></CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Email</TableHead><TableHead className="text-xs">Department</TableHead>
            <TableHead className="text-xs">Position</TableHead><TableHead className="text-xs">Salary</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
            employees.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No employees</TableCell></TableRow> :
            employees.filter(e => !search || `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase())).map(e => (
              <TableRow key={e.id}>
                <TableCell className="text-xs font-medium">{e.firstName} {e.lastName}</TableCell>
                <TableCell className="text-xs">{e.email}</TableCell>
                <TableCell className="text-xs">{e.department || 'N/A'}</TableCell>
                <TableCell className="text-xs">{e.position || 'N/A'}</TableCell>
                <TableCell className="text-xs">${e.baseSalary?.toLocaleString()}</TableCell>
                <TableCell><Badge className={`text-[10px] ${e.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{e.status?.replace('_', ' ')}</Badge></TableCell>
                <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}><Edit className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editItem ? 'Edit Employee' : 'Add Employee'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div><Label className="text-xs">First Name</Label><Input value={form.firstName || ''} onChange={e => setForm({...form, firstName: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Last Name</Label><Input value={form.lastName || ''} onChange={e => setForm({...form, lastName: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Email</Label><Input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Phone</Label><Input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Department</Label><Input value={form.department || ''} onChange={e => setForm({...form, department: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Position</Label><Input value={form.position || ''} onChange={e => setForm({...form, position: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Base Salary ($)</Label><Input type="number" value={form.baseSalary || ''} onChange={e => setForm({...form, baseSalary: parseFloat(e.target.value)})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Status</Label><Select value={form.status || 'active'} onValueChange={v => setForm({...form, status: v})}><SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="on_leave">On Leave</SelectItem><SelectItem value="terminated">Terminated</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>{editItem ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
