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
import { UserCog, User, Briefcase, FileText, Plus, Search, Edit, Trash2, Loader2, Users, UserCheck, UserMinus, Building2 } from 'lucide-react'
import { toast } from 'sonner'

export default function HrEmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try { const res = await fetch('/api/fleet/hr'); if (res.ok) { const j = await res.json(); setEmployees(j.data || []) } } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const url = '/api/fleet/hr'
      const res = editItem
        ? await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editItem.id, ...form }) })
        : await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { toast.success(editItem ? 'Updated' : 'Created'); fetchData(); setOpen(false); setEditItem(null); setForm({}) }
    } catch (e) { toast.error('Failed') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return
    try { const res = await fetch(`/api/fleet/hr?id=${id}`, { method: 'DELETE' }); if (res.ok) { toast.success('Deleted'); fetchData() } } catch (e) { toast.error('Failed') }
  }

  const openCreate = () => { setEditItem(null); setForm({ firstName: '', lastName: '', email: '', phone: '', department: '', position: '', baseSalary: 0, status: 'active', address: '', notes: '' }); setOpen(true) }
  const openEdit = (item: any) => {
    setEditItem(item)
    setForm({
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      email: item.email || '',
      phone: item.phone || '',
      department: item.department || '',
      position: item.position || '',
      baseSalary: item.baseSalary || 0,
      status: item.status || 'active',
      address: item.address || '',
      notes: item.notes || '',
    })
    setOpen(true)
  }

  const statCards = [
    { label: 'Total Employees', value: employees.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Active', value: employees.filter(e => e.status === 'active').length, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'On Leave', value: employees.filter(e => e.status === 'on_leave').length, icon: UserMinus, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Departments', value: new Set(employees.map(e => e.department).filter(Boolean)).size, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div><CardTitle className="text-2xl">Employees</CardTitle><p className="text-sm text-muted-foreground">Manage employee records and data</p></div>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Employee</Button>
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
      <Card><CardHeader className="pb-3"><div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" /></div></CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[440px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Name</TableHead><TableHead className="text-xs hidden md:table-cell">Email</TableHead><TableHead className="text-xs hidden lg:table-cell">Department</TableHead>
            <TableHead className="text-xs hidden lg:table-cell">Position</TableHead><TableHead className="text-xs hidden md:table-cell">Salary</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
            employees.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No employees</TableCell></TableRow> :
            employees.filter(e => !search || `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase())).map(e => (
              <TableRow key={e.id}>
                <TableCell className="text-xs font-medium">{e.firstName} {e.lastName}</TableCell>
                <TableCell className="text-xs hidden md:table-cell">{e.email}</TableCell>
                <TableCell className="text-xs hidden lg:table-cell">{e.department || 'N/A'}</TableCell>
                <TableCell className="text-xs hidden lg:table-cell">{e.position || 'N/A'}</TableCell>
                <TableCell className="text-xs hidden md:table-cell">${e.baseSalary?.toLocaleString()}</TableCell>
                <TableCell><Badge className={`text-[10px] ${e.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{e.status?.replace('_', ' ')}</Badge></TableCell>
                <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}><Edit className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>
      <Dialog open={open} onOpenChange={(v) => { if (!saving) setOpen(v) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{editItem ? 'Edit Employee' : 'Add Employee'}</DialogTitle><DialogDescription>{editItem ? 'Update employee information and details.' : 'Fill in the details to add a new employee.'}</DialogDescription></DialogHeader>
          <div className="space-y-6 py-2">
            {/* Section: Employee Information */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <User className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Employee Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">First Name <span className="text-destructive">*</span></Label><Input required value={form.firstName || ''} onChange={e => setForm({...form, firstName: e.target.value})} className="h-10 mt-1" placeholder="Enter first name" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Last Name <span className="text-destructive">*</span></Label><Input required value={form.lastName || ''} onChange={e => setForm({...form, lastName: e.target.value})} className="h-10 mt-1" placeholder="Enter last name" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Email <span className="text-destructive">*</span></Label><Input required type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="h-10 mt-1" placeholder="employee@company.com" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Phone</Label><Input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="h-10 mt-1" placeholder="e.g. +1 555-0100" /></div>
              </div>
            </div>
            {/* Section: Employment */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Briefcase className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Employment</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Department <span className="text-destructive">*</span></Label><Input required value={form.department || ''} onChange={e => setForm({...form, department: e.target.value})} className="h-10 mt-1" placeholder="e.g. Engineering, Sales" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Position <span className="text-destructive">*</span></Label><Input required value={form.position || ''} onChange={e => setForm({...form, position: e.target.value})} className="h-10 mt-1" placeholder="e.g. Senior Developer" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Base Salary ($) <span className="text-destructive">*</span></Label><Input required type="number" value={form.baseSalary || ''} onChange={e => setForm({...form, baseSalary: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="0.00" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Status</Label><Select value={form.status || 'active'} onValueChange={v => setForm({...form, status: v})}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="on_leave">On Leave</SelectItem><SelectItem value="terminated">Terminated</SelectItem></SelectContent></Select></div>
              </div>
            </div>
            {/* Section: Additional */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Additional</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-3"><Label className="text-xs font-medium text-muted-foreground">Address</Label><Input value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} className="h-10 mt-1" placeholder="Employee address" /></div>
                <div className="col-span-1 md:col-span-3"><Label className="text-xs font-medium text-muted-foreground">Notes</Label><Textarea value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} className="min-h-[80px] mt-1" placeholder="Additional notes about the employee" /></div>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editItem ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
