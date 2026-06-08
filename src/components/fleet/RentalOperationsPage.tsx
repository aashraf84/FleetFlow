'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ArrowLeftRight, LogIn, LogOut, Clock, AlertTriangle, Search } from 'lucide-react'
import { toast } from 'sonner'

const opStatusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  picked_up: 'bg-emerald-100 text-emerald-800',
  returned: 'bg-blue-100 text-blue-800',
  overdue: 'bg-red-100 text-red-800',
}

function getOperationStatus(contract: any): string {
  if (contract.status === 'completed' && contract.mileageIn > 0) return 'returned'
  if (contract.status === 'terminated') return 'returned'
  if (contract.status === 'active' && contract.mileageOut > 0) return 'picked_up'
  if (contract.status === 'active') return 'picked_up'
  // Draft contracts with start date in the past — pending
  if (contract.status === 'draft') {
    const start = new Date(contract.startDate)
    if (start < new Date()) return 'pending'
    return 'pending'
  }
  // Active contract past end date with no return
  if (contract.status === 'active' && new Date(contract.endDate) < new Date()) return 'overdue'
  return 'pending'
}

function getOperationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending Pickup',
    picked_up: 'Picked Up',
    returned: 'Returned',
    overdue: 'Overdue',
  }
  return labels[status] || status
}

export default function RentalOperationsPage() {
  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pickupOpen, setPickupOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [pickupForm, setPickupForm] = useState<any>({ mileageOut: '', conditionNotes: '' })
  const [returnForm, setReturnForm] = useState<any>({ mileageIn: '', fuelLevel: '', conditionNotes: '' })
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [timelineContract, setTimelineContract] = useState<any>(null)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fleet/rentals')
      if (res.ok) { const j = await res.json(); setContracts(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const fmt = (n: number) => `$${n?.toLocaleString()}`
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
  const fmtDateTime = (d: string) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'

  const openPickup = (contract: any) => {
    setSelectedContract(contract)
    setPickupForm({ mileageOut: contract.vehicle?.mileage?.toString() || '', conditionNotes: '' })
    setPickupOpen(true)
  }

  const openReturn = (contract: any) => {
    setSelectedContract(contract)
    setReturnForm({ mileageIn: '', fuelLevel: 'full', conditionNotes: '' })
    setReturnOpen(true)
  }

  const openTimeline = (contract: any) => {
    setTimelineContract(contract)
    setTimelineOpen(true)
  }

  const handlePickup = async () => {
    if (!pickupForm.mileageOut) {
      toast.error('Mileage out is required')
      return
    }
    try {
      const res = await fetch('/api/fleet/rentals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedContract.id,
          statusChange: 'active',
          mileageOut: parseFloat(pickupForm.mileageOut),
          notes: pickupForm.conditionNotes ? `[Pickup] ${pickupForm.conditionNotes}` : undefined,
        })
      })
      if (res.ok) {
        toast.success('Pickup recorded — contract activated')
        fetchData()
        setPickupOpen(false)
      } else {
        const j = await res.json()
        toast.error(j.error || 'Failed')
      }
    } catch (e) { toast.error('Request failed') }
  }

  const handleReturn = async () => {
    if (!returnForm.mileageIn) {
      toast.error('Mileage in is required')
      return
    }
    try {
      const res = await fetch('/api/fleet/rentals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedContract.id,
          statusChange: 'completed',
          mileageIn: parseFloat(returnForm.mileageIn),
          notes: returnForm.conditionNotes ? `[Return] Fuel: ${returnForm.fuelLevel}. ${returnForm.conditionNotes}` : `[Return] Fuel: ${returnForm.fuelLevel}`,
        })
      })
      if (res.ok) {
        toast.success('Return recorded — contract completed')
        fetchData()
        setReturnOpen(false)
      } else {
        const j = await res.json()
        toast.error(j.error || 'Failed')
      }
    } catch (e) { toast.error('Request failed') }
  }

  // Build operations list from contracts
  const operations = contracts.map(c => ({
    ...c,
    opStatus: getOperationStatus(c),
  }))

  const filtered = operations.filter(c => {
    if (!search) return true
    const customer = c.customer ? `${c.customer.firstName} ${c.customer.lastName}` : ''
    const vehicle = c.vehicle ? `${c.vehicle.make} ${c.vehicle.model}` : ''
    return customer.toLowerCase().includes(search.toLowerCase()) ||
      vehicle.toLowerCase().includes(search.toLowerCase()) ||
      c.contractNumber?.toLowerCase().includes(search.toLowerCase())
  })

  const stats = [
    { label: 'Total Contracts', value: contracts.length, icon: ArrowLeftRight },
    { label: 'Pending Pickup', value: operations.filter(o => o.opStatus === 'pending').length, icon: Clock },
    { label: 'Picked Up', value: operations.filter(o => o.opStatus === 'picked_up').length, icon: LogIn },
    { label: 'Returned', value: operations.filter(o => o.opStatus === 'returned').length, icon: LogOut },
    { label: 'Overdue', value: operations.filter(o => o.opStatus === 'overdue').length, icon: AlertTriangle },
  ]

  const buildTimeline = (contract: any) => {
    const events: { label: string; date: string; detail: string; type: string }[] = []

    events.push({
      label: 'Contract Created',
      date: contract.createdAt,
      detail: `Contract ${contract.contractNumber} created as ${contract.status}`,
      type: 'created',
    })

    if (contract.signedDate || contract.status === 'active') {
      events.push({
        label: 'Vehicle Picked Up',
        date: contract.signedDate || contract.updatedAt,
        detail: `Mileage out: ${contract.mileageOut?.toLocaleString() || 0} km`,
        type: 'pickup',
      })
    }

    if (contract.returnDate || contract.status === 'completed' || contract.status === 'terminated') {
      events.push({
        label: contract.status === 'terminated' ? 'Contract Terminated' : 'Vehicle Returned',
        date: contract.returnDate || contract.updatedAt,
        detail: `Mileage in: ${contract.mileageIn?.toLocaleString() || 0} km${contract.mileageIn && contract.mileageOut ? ` | Used: ${(contract.mileageIn - contract.mileageOut).toLocaleString()} km` : ''}`,
        type: contract.status === 'terminated' ? 'terminated' : 'return',
      })
    }

    // Check if overdue
    if (contract.status === 'active' && new Date(contract.endDate) < new Date()) {
      events.push({
        label: 'Overdue',
        date: contract.endDate,
        detail: `Contract past end date ${fmtDate(contract.endDate)}`,
        type: 'overdue',
      })
    }

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rental Operations</h2>
          <p className="text-sm text-muted-foreground">Track pickups, returns, and contract operations</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <s.icon className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
              <p className="text-xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search operations..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Contract #</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Vehicle</TableHead>
                  <TableHead className="text-xs">Period</TableHead>
                  <TableHead className="text-xs">Mileage Out</TableHead>
                  <TableHead className="text-xs">Mileage In</TableHead>
                  <TableHead className="text-xs">Operation Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No rental operations found</TableCell></TableRow>
                ) : filtered.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs font-mono">{c.contractNumber}</TableCell>
                    <TableCell className="text-xs">{c.customer ? `${c.customer.firstName} ${c.customer.lastName}` : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{c.vehicle ? `${c.vehicle.make} ${c.vehicle.model}` : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{fmtDate(c.startDate)} - {fmtDate(c.endDate)}</TableCell>
                    <TableCell className="text-xs">{c.mileageOut ? `${Number(c.mileageOut).toLocaleString()} km` : '—'}</TableCell>
                    <TableCell className="text-xs">{c.mileageIn ? `${Number(c.mileageIn).toLocaleString()} km` : '—'}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${opStatusColors[c.opStatus] || ''}`}>
                        {getOperationStatusLabel(c.opStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {(c.opStatus === 'pending' || c.status === 'draft') && (
                          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => openPickup(c)}>
                            <LogIn className="h-3 w-3" /> Pickup
                          </Button>
                        )}
                        {(c.opStatus === 'picked_up' || c.opStatus === 'overdue') && (
                          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => openReturn(c)}>
                            <LogOut className="h-3 w-3" /> Return
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => openTimeline(c)}>
                          <Clock className="h-3 w-3" /> Timeline
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Record Pickup Dialog */}
      <Dialog open={pickupOpen} onOpenChange={setPickupOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Pickup</DialogTitle>
            <DialogDescription>Record vehicle pickup details and activate the rental contract.</DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="col-span-1 md:col-span-2 bg-muted p-3 rounded-md text-sm space-y-1">
                <p><span className="font-medium">Contract:</span> {selectedContract.contractNumber}</p>
                <p><span className="font-medium">Customer:</span> {selectedContract.customer ? `${selectedContract.customer.firstName} ${selectedContract.customer.lastName}` : 'N/A'}</p>
                <p><span className="font-medium">Vehicle:</span> {selectedContract.vehicle ? `${selectedContract.vehicle.make} ${selectedContract.vehicle.model}` : 'N/A'}</p>
              </div>
              <div>
                <Label>Mileage Out (km) *</Label>
                <Input
                  type="number"
                  value={pickupForm.mileageOut}
                  onChange={e => setPickupForm({ ...pickupForm, mileageOut: e.target.value })}
                  className="h-10 mt-1"
                  placeholder="Current odometer reading"
                  required
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <Label>Condition Notes</Label>
                <Textarea
                  value={pickupForm.conditionNotes}
                  onChange={e => setPickupForm({ ...pickupForm, conditionNotes: e.target.value })}
                  className="mt-1 min-h-[80px]"
                  rows={3}
                  placeholder="Note any pre-existing damage or conditions..."
                />
              </div>
              <div className="col-span-1 md:col-span-2 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 p-3 rounded-md text-xs">
                Recording pickup will activate the contract and mark the vehicle as rented.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickupOpen(false)}>Cancel</Button>
            <Button onClick={handlePickup}>
              <LogIn className="h-4 w-4 mr-2" />Confirm Pickup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Return Dialog */}
      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Return</DialogTitle>
            <DialogDescription>Record vehicle return details including mileage, fuel level, and condition.</DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="col-span-1 md:col-span-2 bg-muted p-3 rounded-md text-sm space-y-1">
                <p><span className="font-medium">Contract:</span> {selectedContract.contractNumber}</p>
                <p><span className="font-medium">Customer:</span> {selectedContract.customer ? `${selectedContract.customer.firstName} ${selectedContract.customer.lastName}` : 'N/A'}</p>
                <p><span className="font-medium">Vehicle:</span> {selectedContract.vehicle ? `${selectedContract.vehicle.make} ${selectedContract.vehicle.model}` : 'N/A'}</p>
                <p><span className="font-medium">Mileage Out:</span> {selectedContract.mileageOut?.toLocaleString() || 0} km</p>
              </div>
              <div>
                <Label>Mileage In (km) *</Label>
                <Input
                  type="number"
                  value={returnForm.mileageIn}
                  onChange={e => setReturnForm({ ...returnForm, mileageIn: e.target.value })}
                  className="h-10 mt-1"
                  placeholder="Current odometer reading"
                  required
                />
              </div>
              <div>
                <Label>Fuel Level</Label>
                <div className="flex gap-2 mt-2">
                  {['empty', 'quarter', 'half', 'three_quarter', 'full'].map(level => (
                    <Button
                      key={level}
                      variant={returnForm.fuelLevel === level ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 text-[10px] capitalize"
                      onClick={() => setReturnForm({ ...returnForm, fuelLevel: level })}
                    >
                      {level.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="col-span-1 md:col-span-2">
                <Label>Condition Notes</Label>
                <Textarea
                  value={returnForm.conditionNotes}
                  onChange={e => setReturnForm({ ...returnForm, conditionNotes: e.target.value })}
                  className="mt-1 min-h-[80px]"
                  rows={3}
                  placeholder="Note any damage, issues, or observations..."
                />
              </div>
              {returnForm.mileageIn && selectedContract.mileageOut && (
                <div className="col-span-1 md:col-span-2 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 p-3 rounded-md text-xs space-y-1">
                  <p><span className="font-medium">Distance Used:</span> {Math.max(0, parseFloat(returnForm.mileageIn) - selectedContract.mileageOut).toLocaleString()} km</p>
                  {selectedContract.mileageLimit && (
                    <p><span className="font-medium">Mileage Limit:</span> {Number(selectedContract.mileageLimit).toLocaleString()} km
                      {parseFloat(returnForm.mileageIn) - selectedContract.mileageOut > selectedContract.mileageLimit && (
                        <span className="text-red-600 font-bold ml-2">OVER LIMIT!</span>
                      )}
                    </p>
                  )}
                </div>
              )}
              <div className="col-span-1 md:col-span-2 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 p-3 rounded-md text-xs">
                Recording return will complete the contract and mark the vehicle as available.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnOpen(false)}>Cancel</Button>
            <Button onClick={handleReturn}>
              <LogOut className="h-4 w-4 mr-2" />Confirm Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Timeline Dialog */}
      <Dialog open={timelineOpen} onOpenChange={setTimelineOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Operations Timeline — {timelineContract?.contractNumber}</DialogTitle>
            <DialogDescription>View the full timeline of pickup, return, and status change events.</DialogDescription>
          </DialogHeader>
          {timelineContract && (
            <div className="py-4">
              <div className="bg-muted p-3 rounded-md text-sm mb-4 space-y-1">
                <p><span className="font-medium">Customer:</span> {timelineContract.customer ? `${timelineContract.customer.firstName} ${timelineContract.customer.lastName}` : 'N/A'}</p>
                <p><span className="font-medium">Vehicle:</span> {timelineContract.vehicle ? `${timelineContract.vehicle.make} ${timelineContract.vehicle.model}` : 'N/A'}</p>
                <p><span className="font-medium">Period:</span> {fmtDate(timelineContract.startDate)} - {fmtDate(timelineContract.endDate)}</p>
              </div>

              <div className="space-y-0">
                {buildTimeline(timelineContract).map((event, idx) => {
                  const typeStyles: Record<string, string> = {
                    created: 'border-gray-300 bg-gray-50',
                    pickup: 'border-emerald-300 bg-emerald-50',
                    return: 'border-blue-300 bg-blue-50',
                    terminated: 'border-red-300 bg-red-50',
                    overdue: 'border-amber-300 bg-amber-50',
                  }
                  const dotStyles: Record<string, string> = {
                    created: 'bg-gray-400',
                    pickup: 'bg-emerald-500',
                    return: 'bg-blue-500',
                    terminated: 'bg-red-500',
                    overdue: 'bg-amber-500',
                  }
                  return (
                    <div key={idx} className="flex gap-3 pb-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${dotStyles[event.type] || 'bg-gray-400'}`} />
                        {idx < buildTimeline(timelineContract).length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-200" />
                        )}
                      </div>
                      <div className={`flex-1 border-l-2 pl-3 py-1 rounded-r-md ${typeStyles[event.type] || 'border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{event.label}</p>
                          <p className="text-[10px] text-muted-foreground">{fmtDateTime(event.date)}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{event.detail}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
