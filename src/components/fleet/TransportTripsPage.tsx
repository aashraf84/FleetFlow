'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Route } from 'lucide-react'

export default function TransportTripsPage() {
  const [trips, setTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fleet/trips?XTransformPort=3000')
      if (res.ok) { const j = await res.json(); setTrips(j.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const stats = [
    { label: 'Total Trips', value: trips.length },
    { label: 'In Progress', value: trips.filter(t => t.status === 'in_progress').length },
    { label: 'Completed', value: trips.filter(t => t.status === 'completed').length },
    { label: 'Avg Distance', value: trips.length > 0 ? `${(trips.reduce((s, t) => s + (t.distance || 0), 0) / trips.length).toFixed(0)} km` : '0 km' },
  ]

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Trip Management</h2><p className="text-sm text-muted-foreground">Track trip distances, ETAs, and performance</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader><TableRow>
                <TableHead className="text-xs">Dispatch Order</TableHead><TableHead className="text-xs">Driver</TableHead><TableHead className="text-xs">Distance (km)</TableHead>
                <TableHead className="text-xs">ETA</TableHead><TableHead className="text-xs">Delay (min)</TableHead><TableHead className="text-xs">Fuel Used</TableHead><TableHead className="text-xs">Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow> :
                trips.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No trips recorded</TableCell></TableRow> :
                trips.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs font-mono">{t.dispatchOrder?.orderNumber || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{t.driver ? `${t.driver.firstName} ${t.driver.lastName}` : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{t.distance?.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{t.eta ? new Date(t.eta).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell className="text-xs">{t.delayMinutes > 0 ? <Badge variant="destructive" className="text-[10px]">+{t.delayMinutes}</Badge> : '0'}</TableCell>
                    <TableCell className="text-xs">{t.fuelConsumed}L</TableCell>
                    <TableCell><Badge className={`text-[10px] ${t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : t.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{t.status?.replace('_', ' ')}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
