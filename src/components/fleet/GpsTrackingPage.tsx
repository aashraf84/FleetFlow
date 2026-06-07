'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Activity, Navigation } from 'lucide-react'

export default function GpsTrackingPage() {
  const [data, setData] = useState<any>({ locations: [], vehicles: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fleet/gps?XTransformPort=3000')
      if (res.ok) { const j = await res.json(); setData(j.data || { locations: [], vehicles: [] }) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const { locations, vehicles } = data

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">GPS Tracking</h2><p className="text-sm text-muted-foreground">Live vehicle tracking and location monitoring</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tracked Vehicles', value: vehicles.length },
          { label: 'Active', value: vehicles.filter((v: any) => v.status === 'rented' || v.status === 'in_service').length },
          { label: 'GPS Points', value: locations.length },
          { label: 'Avg Speed', value: locations.length > 0 ? `${(locations.reduce((s: number, l: any) => s + (l.speed || 0), 0) / locations.length).toFixed(0)} km/h` : '0' },
        ].map(s => <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></CardContent></Card>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Map View</CardTitle></CardHeader>
          <CardContent>
            <div className="h-80 rounded-lg border bg-muted/30 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                {locations.slice(0, 20).map((l: any, i: number) => (
                  <div key={i} className="absolute" style={{ left: `${((l.longitude + 180) / 360) * 100}%`, top: `${((90 - l.latitude) / 180) * 100}%` }}>
                    <MapPin className="h-4 w-4 text-emerald-600" />
                  </div>
                ))}
              </div>
              <div className="text-center z-10">
                <Navigation className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">GPS tracking interface</p>
                <p className="text-xs text-muted-foreground/60">Connect GPS hardware for live tracking</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Vehicle Locations</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {vehicles.length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">No vehicles tracked</div> :
              vehicles.map((v: any) => (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className={`p-2 rounded-full ${v.status === 'rented' ? 'bg-emerald-100' : v.status === 'maintenance' ? 'bg-red-100' : 'bg-gray-100'}`}>
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{v.make} {v.model}</p>
                    <p className="text-xs text-muted-foreground">{v.vehicleNumber} · {v.currentLocation || 'Location unknown'}</p>
                  </div>
                  <Badge className={`text-[10px] ${v.status === 'available' ? 'bg-emerald-100 text-emerald-800' : v.status === 'rented' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{v.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Recent GPS Pings</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {locations.slice(0, 30).map((l: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-1.5 text-xs">
                <Activity className="h-3 w-3 text-emerald-500" />
                <span className="font-medium">{l.vehicle ? `${l.vehicle.make} ${l.vehicle.model}` : 'Unknown'}</span>
                <span className="text-muted-foreground">Lat: {l.latitude?.toFixed(4)} Lon: {l.longitude?.toFixed(4)}</span>
                <span className="text-muted-foreground ml-auto">{l.speed} km/h</span>
                <span className="text-muted-foreground">{new Date(l.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
            {locations.length === 0 && <div className="text-center py-4 text-muted-foreground text-sm">No GPS data available</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
