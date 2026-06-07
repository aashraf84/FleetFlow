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
import { Users, Plus, Search, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export default function CustomersPage() {
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
      const res = await fetch(`/api/fleet/customers?search=${search}`)
      if (res.ok) { const j = await res.json(); setData(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  useEffect(() => { const t = setTimeout(fetchData, 300); return () => clearTimeout(t) }, [search])

  const handleSubmit = async () => {
    try {
      const url = '/api/fleet/customers'
      const res = editItem
        ? await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editItem.id, ...form }) })
        : await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { toast.success(editItem ? 'Updated' : 'Created'); fetchData(); setOpen(false); setEditItem(null); setForm({}) }
      else toast.error('Failed')
    } catch (e) { toast.error('Request failed') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return
    try { const res = await fetch(`/api/fleet/customers?id=${id}`, { method: 'DELETE' }); if (res.ok) { toast.success('Deleted'); fetchData() } } catch (e) { toast.error('Failed') }
  }

  const openCreate = () => { setEditItem(null); setForm({ firstName: '', lastName: '', email: '', phone: '', status: 'active', creditRating: 'good' }); setOpen(true) }
  const openEdit = (item: any) => { setEditItem(item); setForm(item); setOpen(true) }

  const stats = [
    { label: 'Total Customers', value: data.length },
    { label: 'Active', value: data.filter(c => c.status === 'active').length },
    { label: 'Blacklisted', value: data.filter(c => c.status === 'blacklisted').length },
    { label: 'Good Credit', value: data.filter(c => c.creditRating === 'good' || c.creditRating === 'excellent').length },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Customer Management</h2><p className="text-sm text-muted-foreground">Manage customer records and rental history</p></div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Customer</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card>
        <CardHeader className="pb-3"><div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" /></div></CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Email</TableHead><TableHead className="text-xs">Phone</TableHead>
                <TableHead className="text-xs">Company</TableHead><TableHead className="text-xs">License</TableHead><TableHead className="text-xs">Credit</TableHead>
                <TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow> :
                data.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No customers found</TableCell></TableRow> :
                data.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs font-medium">{c.firstName} {c.lastName}</TableCell>
                    <TableCell className="text-xs">{c.email}</TableCell>
                    <TableCell className="text-xs">{c.phone || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{c.companyName || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{c.drivingLicense || 'N/A'}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] capitalize">{c.creditRating}</Badge></TableCell>
                    <TableCell><Badge className={`text-[10px] ${c.status === 'active' ? 'bg-emerald-100 text-emerald-800' : c.status === 'blacklisted' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{c.status}</Badge></TableCell>
                    <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Edit className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Customer' : 'Add Customer'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div><Label className="text-xs">First Name</Label><Input value={form.firstName || ''} onChange={e => setForm({...form, firstName: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Last Name</Label><Input value={form.lastName || ''} onChange={e => setForm({...form, lastName: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Email</Label><Input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Phone</Label><Input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Company</Label><Input value={form.companyName || ''} onChange={e => setForm({...form, companyName: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Driving License</Label><Input value={form.drivingLicense || ''} onChange={e => setForm({...form, drivingLicense: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Address</Label><Input value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">City</Label><Input value={form.city || ''} onChange={e => setForm({...form, city: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Country</Label><Input value={form.country || ''} onChange={e => setForm({...form, country: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">ID Number</Label><Input value={form.idNumber || ''} onChange={e => setForm({...form, idNumber: e.target.value})} className="h-9 mt-1" /></div>
            <div><Label className="text-xs">Credit Rating</Label><Select value={form.creditRating || 'good'} onValueChange={v => setForm({...form, creditRating: v})}><SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="excellent">Excellent</SelectItem><SelectItem value="good">Good</SelectItem><SelectItem value="fair">Fair</SelectItem><SelectItem value="poor">Poor</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Status</Label><Select value={form.status || 'active'} onValueChange={v => setForm({...form, status: v})}><SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="blacklisted">Blacklisted</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>{editItem ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
