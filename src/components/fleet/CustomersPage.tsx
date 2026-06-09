'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, Plus, Search, Edit, Trash2, Loader2, User, CreditCard, MapPin, Phone, FileText, CheckCircle, Ban, Star } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function CustomersPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

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
    setSaving(true)
    try {
      const url = '/api/fleet/customers'
      const res = editItem
        ? await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editItem.id, ...form }) })
        : await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { toast.success(editItem ? 'Updated' : 'Created'); fetchData(); setOpen(false); setEditItem(null); setForm({}) }
      else toast.error('Failed')
    } catch (e) { toast.error('Request failed') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return
    try { const res = await fetch(`/api/fleet/customers?id=${id}`, { method: 'DELETE' }); if (res.ok) { toast.success('Deleted'); fetchData() } } catch (e) { toast.error('Failed') }
  }

  const openCreate = () => { setEditItem(null); setForm({ firstName: '', lastName: '', email: '', phone: '', status: 'active', creditRating: 'good', nationality: '', licenseExpiry: '', dateOfBirth: '', emergencyContact: '', emergencyPhone: '', notes: '' }); setOpen(true) }
  const openEdit = (item: any) => {
    setEditItem(item)
    setForm({
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      email: item.email || '',
      phone: item.phone || '',
      companyName: item.companyName || '',
      drivingLicense: item.drivingLicense || '',
      address: item.address || '',
      city: item.city || '',
      country: item.country || '',
      idNumber: item.idNumber || '',
      creditRating: item.creditRating || 'good',
      status: item.status || 'active',
      nationality: item.nationality || '',
      licenseExpiry: item.licenseExpiry || '',
      dateOfBirth: item.dateOfBirth || '',
      emergencyContact: item.emergencyContact || '',
      emergencyPhone: item.emergencyPhone || '',
      notes: item.notes || '',
    })
    setOpen(true)
  }

  const stats = [
    { label: 'Total Customers', value: data.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Active', value: data.filter(c => c.status === 'active').length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Blacklisted', value: data.filter(c => c.status === 'blacklisted').length, icon: Ban, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
    { label: 'Good Credit', value: data.filter(c => c.creditRating === 'good' || c.creditRating === 'excellent').length, icon: Star, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Customer Management</CardTitle>
              <CardDescription className="text-sm">Manage customer records and rental history</CardDescription>
            </div>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Customer</Button>
          </div>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
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
      <Card>
        <CardHeader className="pb-3"><div className="relative w-64"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" /></div></CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[440px]">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Email</TableHead><TableHead className="text-xs hidden md:table-cell">Phone</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Company</TableHead><TableHead className="text-xs hidden lg:table-cell">License</TableHead><TableHead className="text-xs hidden md:table-cell">Credit</TableHead>
                <TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow> :
                data.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No customers found</TableCell></TableRow> :
                data.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs font-medium">{c.firstName} {c.lastName}</TableCell>
                    <TableCell className="text-xs">{c.email}</TableCell>
                    <TableCell className="text-xs hidden md:table-cell">{c.phone || 'N/A'}</TableCell>
                    <TableCell className="text-xs hidden lg:table-cell">{c.companyName || 'N/A'}</TableCell>
                    <TableCell className="text-xs hidden lg:table-cell">{c.drivingLicense || 'N/A'}</TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-[10px] capitalize">{c.creditRating}</Badge></TableCell>
                    <TableCell><Badge className={`text-[10px] ${c.status === 'active' ? 'bg-emerald-100 text-emerald-800' : c.status === 'blacklisted' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{c.status}</Badge></TableCell>
                    <TableCell><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Edit className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { if (!saving) setOpen(v) }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
            <DialogDescription>{editItem ? 'Update customer personal information and settings' : 'Register a new customer with personal and contact details'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {/* Section: Personal Information */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <User className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">First Name *</Label><Input value={form.firstName || ''} onChange={e => setForm({...form, firstName: e.target.value})} className="h-10 mt-1" required placeholder="Enter first name" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Last Name *</Label><Input value={form.lastName || ''} onChange={e => setForm({...form, lastName: e.target.value})} className="h-10 mt-1" required placeholder="Enter last name" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Email *</Label><Input type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="h-10 mt-1" required placeholder="customer@email.com" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Phone</Label><Input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} className="h-10 mt-1" placeholder="+1 (555) 000-0000" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Nationality</Label><Input value={form.nationality || ''} onChange={e => setForm({...form, nationality: e.target.value})} className="h-10 mt-1" placeholder="e.g. US, UK, UAE" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Date of Birth</Label><Input type="date" value={form.dateOfBirth ? form.dateOfBirth.split('T')[0] : ''} onChange={e => setForm({...form, dateOfBirth: e.target.value})} className="h-10 mt-1" /></div>
              </div>
            </div>

            {/* Section: Identification */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <CreditCard className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Identification</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">ID Number</Label><Input value={form.idNumber || ''} onChange={e => setForm({...form, idNumber: e.target.value})} className="h-10 mt-1" placeholder="ID number" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Driving License</Label><Input value={form.drivingLicense || ''} onChange={e => setForm({...form, drivingLicense: e.target.value})} className="h-10 mt-1" placeholder="License number" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">License Expiry</Label><Input type="date" value={form.licenseExpiry ? form.licenseExpiry.split('T')[0] : ''} onChange={e => setForm({...form, licenseExpiry: e.target.value})} className="h-10 mt-1" /></div>
              </div>
            </div>

            {/* Section: Address */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Address</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Address</Label><Input value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} className="h-10 mt-1" placeholder="Street address" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">City</Label><Input value={form.city || ''} onChange={e => setForm({...form, city: e.target.value})} className="h-10 mt-1" placeholder="City" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Country</Label><Input value={form.country || ''} onChange={e => setForm({...form, country: e.target.value})} className="h-10 mt-1" placeholder="Country" /></div>
              </div>
            </div>

            {/* Section: Emergency Contact */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <Phone className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Emergency Contact</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Emergency Contact</Label><Input value={form.emergencyContact || ''} onChange={e => setForm({...form, emergencyContact: e.target.value})} className="h-10 mt-1" placeholder="Emergency contact name" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Emergency Phone</Label><Input value={form.emergencyPhone || ''} onChange={e => setForm({...form, emergencyPhone: e.target.value})} className="h-10 mt-1" placeholder="+1 (555) 911-0000" /></div>
              </div>
            </div>

            {/* Section: Additional */}
            <div>
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border/50">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Additional</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label className="text-xs font-medium text-muted-foreground">Company</Label><Input value={form.companyName || ''} onChange={e => setForm({...form, companyName: e.target.value})} className="h-10 mt-1" placeholder="Company name" /></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Credit Rating</Label><Select value={form.creditRating || 'good'} onValueChange={v => setForm({...form, creditRating: v})}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select rating" /></SelectTrigger><SelectContent><SelectItem value="excellent">Excellent</SelectItem><SelectItem value="good">Good</SelectItem><SelectItem value="fair">Fair</SelectItem><SelectItem value="poor">Poor</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs font-medium text-muted-foreground">Status</Label><Select value={form.status || 'active'} onValueChange={v => setForm({...form, status: v})}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select status" /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="blacklisted">Blacklisted</SelectItem></SelectContent></Select></div>
                <div className="col-span-1 md:col-span-3"><Label className="text-xs font-medium text-muted-foreground">Notes</Label><Textarea value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} className="h-10 mt-1 min-h-[80px]" placeholder="Additional notes about this customer..." /></div>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSubmit(); }} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editItem ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
