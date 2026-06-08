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
import { ScrollArea } from '@/components/ui/scroll-area'
import { IdCard, Plus, Search, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function DriversPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState<any>({})

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/fleet/drivers?search=${search}`)
      if (res.ok) { const j = await res.json(); setData(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { const t = setTimeout(fetchData, 300); return () => clearTimeout(t) }, [search])

  const handleSubmit = async () => {
    try {
      const url = '/api/fleet/drivers'
      const res = editItem
        ? await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editItem.id, ...form }) })
        : await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { toast.success(editItem ? 'Updated' : 'Created'); fetchData(); setOpen(false); setEditItem(null); setForm({}) }
      else toast.error('Failed')
    } catch (e) { toast.error('Request failed') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return
    try { const res = await fetch(`/api/fleet/drivers?id=${id}`, { method: 'DELETE' }); if (res.ok) { toast.success('Deleted'); fetchData() } } catch (e) { toast.error('Failed') }
  }

  const openCreate = () => { setEditItem(null); setForm({ firstName: '', lastName: '', phone: '', licenseNumber: '', status: 'active', employmentType: 'full_time', rating: 5.0, baseSalary: 0 }); setOpen(true) }
  const openEdit = (item: any) => { setEditItem(item); setForm(item); setOpen(true) }

  const stats = [
    { label: 'Total Drivers', value: data.length },
    { label: 'Active', value: data.filter(d => d.status === 'active').length },
    { label: 'On Leave', value: data.filter(d => d.status === 'on_leave').length },
    { label: 'Avg Rating', value: data.length > 0 ? (data.reduce((s, d) => s + (d.rating || 0), 0) / data.length).toFixed(1) : '0' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Driver Management</h2><p className="text-sm text-muted-foreground">Manage drivers, licenses, and performance</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Driver</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card>
        <CardHeader className="pb-3"><div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search drivers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" /></div></CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Phone</TableHead><TableHead className="text-xs">License #</TableHead>
                <TableHead className="text-xs">License Expiry</TableHead><TableHead className="text-xs">Employment</TableHead><TableHead className="text-xs">Hours</TableHead>
                <TableHead className="text-xs">Rating</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={9} className="text-center py-8">Loading...</TableCell></TableRow> :
                data.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No drivers found</TableCell></TableRow> :
                data.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="text-xs font-medium">{d.firstName} {d.lastName}</TableCell>
                    <TableCell className="text-xs">{d.phone}</TableCell>
                    <TableCell className="text-xs font-mono">{d.licenseNumber}</TableCell>
                    <TableCell className="text-xs">{d.licenseExpiry ? new Date(d.licenseExpiry).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="text-xs capitalize">{d.employmentType?.replace('_', ' ')}</TableCell>
                    <TableCell className="text-xs">{d.drivingHours}h</TableCell>
                    <TableCell className="text-xs"><Badge variant="outline" className="text-[10px]">{'★'.repeat(Math.round(d.rating || 0))}</Badge></TableCell>
                    <TableCell><Badge className={`text-[10px] ${d.status === 'active' ? 'bg-emerald-100 text-emerald-800' : d.status === 'on_leave' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>{d.status?.replace('_', ' ')}</Badge></TableCell>
                    <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(d)}><Edit className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(d.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Driver' : 'Add Driver'}</DialogTitle>
            <DialogDescription>{editItem ? 'Update driver information, license, and employment details' : 'Register a new driver with personal and license information'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div><Label className="text-xs">First Name *</Label><Input value={form.firstName || ''} onChange={e => setForm({...form, firstName: e.target.value})} className="h-10 mt-1" required placeholder="Enter first name" /></div>
            <div><Label className="text-xs">Last Name *</Label><Input value={form.lastName || ''} onChange={e => setForm({...form, lastName: e.target.value})} className="h-10 mt-1" required placeholder="Enter last name" /></div>
            <div><Label className="text-xs">Email</Label><Input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="h-10 mt-1" placeholder="driver@email.com" /></div>
            <div><Label className="text-xs">Phone *</Label><Input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="h-10 mt-1" required placeholder="+1 (555) 000-0000" /></div>
            <div><Label className="text-xs">License Number *</Label><Input value={form.licenseNumber || ''} onChange={e => setForm({...form, licenseNumber: e.target.value})} className="h-10 mt-1" required placeholder="DL-12345678" /></div>
            <div><Label className="text-xs">License Expiry</Label><Input type="date" value={form.licenseExpiry ? form.licenseExpiry.split('T')[0] : ''} onChange={e => setForm({...form, licenseExpiry: e.target.value})} className="h-10 mt-1" /></div>
            <div><Label className="text-xs">License Class</Label><Input value={form.licenseClass || ''} onChange={e => setForm({...form, licenseClass: e.target.value})} className="h-10 mt-1" placeholder="e.g., Class A, B, C" /></div>
            <div><Label className="text-xs">Employment Type</Label><Select value={form.employmentType || 'full_time'} onValueChange={v => setForm({...form, employmentType: v})}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="full_time">Full Time</SelectItem><SelectItem value="part_time">Part Time</SelectItem><SelectItem value="contract">Contract</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Base Salary ($)</Label><Input type="number" value={form.baseSalary || ''} onChange={e => setForm({...form, baseSalary: parseFloat(e.target.value)})} className="h-10 mt-1" placeholder="0.00" /></div>
            <div><Label className="text-xs">Status</Label><Select value={form.status || 'active'} onValueChange={v => setForm({...form, status: v})}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="on_leave">On Leave</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="terminated">Terminated</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>{editItem ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
