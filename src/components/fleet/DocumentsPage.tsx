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
import { FolderOpen, Plus, Upload } from 'lucide-react'
import { toast } from 'sonner'

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try { const res = await fetch('/api/fleet/documents'); if (res.ok) { const j = await res.json(); setDocuments(j.data || []) } } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/fleet/documents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { toast.success('Document added'); fetchData(); setOpen(false); setForm({}) } else toast.error('Failed')
    } catch (e) { toast.error('Failed') }
  }

  const handleDelete = async (id: string) => {
    try { const res = await fetch(`/api/fleet/documents?id=${id}`, { method: 'DELETE' }); if (res.ok) { toast.success('Deleted'); fetchData() } } catch (e) { toast.error('Failed') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Document Management</h2><p className="text-sm text-muted-foreground">Store and manage contracts, licenses, and compliance documents</p></div>
        <Button onClick={() => { setForm({ title: '', category: 'general', fileName: '', fileUrl: '' }); setOpen(true) }}><Plus className="h-4 w-4 mr-2" />Add Document</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Documents', value: documents.length },
          { label: 'Contracts', value: documents.filter(d => d.category === 'contract').length },
          { label: 'Licenses', value: documents.filter(d => d.category === 'license').length },
          { label: 'Insurance', value: documents.filter(d => d.category === 'insurance').length },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card><CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          <Table><TableHeader><TableRow>
            <TableHead className="text-xs">Title</TableHead><TableHead className="text-xs">Category</TableHead><TableHead className="text-xs">File Name</TableHead>
            <TableHead className="text-xs">Version</TableHead><TableHead className="text-xs">Uploaded By</TableHead><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Actions</TableHead>
          </TableRow></TableHeader><TableBody>
            {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
            documents.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No documents</TableCell></TableRow> :
            documents.map(d => (
              <TableRow key={d.id}>
                <TableCell className="text-xs font-medium">{d.title}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px] capitalize">{d.category}</Badge></TableCell>
                <TableCell className="text-xs">{d.fileName}</TableCell>
                <TableCell className="text-xs">v{d.version}</TableCell>
                <TableCell className="text-xs">{d.uploadedBy || 'N/A'}</TableCell>
                <TableCell className="text-xs">{new Date(d.createdAt).toLocaleDateString()}</TableCell>
                <TableCell><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(d.id)}><Upload className="h-3.5 w-3.5" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody></Table>
        </ScrollArea>
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
            <DialogDescription>Upload a new document to the system. Provide document details and category.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div><Label className="text-xs">Title *</Label><Input value={form.title || ''} onChange={e => setForm({...form, title: e.target.value})} className="h-10 mt-1" required placeholder="Document title" /></div>
            <div><Label className="text-xs">Category</Label><Select value={form.category || 'general'} onValueChange={v => setForm({...form, category: v})}><SelectTrigger className="h-10 mt-1"><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent><SelectItem value="contract">Contract</SelectItem><SelectItem value="license">License</SelectItem><SelectItem value="insurance">Insurance</SelectItem><SelectItem value="vehicle">Vehicle</SelectItem><SelectItem value="compliance">Compliance</SelectItem><SelectItem value="general">General</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">File Name</Label><Input value={form.fileName || ''} onChange={e => setForm({...form, fileName: e.target.value})} className="h-10 mt-1" placeholder="document.pdf" /></div>
            <div className="col-span-1 md:col-span-2"><Label className="text-xs">Description</Label><Textarea value={form.description || ''} onChange={e => setForm({...form, description: e.target.value})} className="min-h-[80px] mt-1 text-sm" placeholder="Describe this document..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
