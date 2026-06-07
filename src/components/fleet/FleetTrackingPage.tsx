'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BarChart3, TrendingUp, Car, Fuel, DollarSign, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6', '#06b6d4']

export default function FleetTrackingPage() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fleet/vehicles')
      if (res.ok) { const json = await res.json(); setVehicles(json.data || []) }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const statusData = Object.entries(
    vehicles.reduce((acc: any, v) => { acc[v.status] = (acc[v.status] || 0) + 1; return acc }, {})
  ).map(([name, value]) => ({ name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), value: value as number }))

  const categoryData = Object.entries(
    vehicles.reduce((acc: any, v) => { acc[v.category] = (acc[v.category] || 0) + 1; return acc }, {})
  ).map(([name, count]) => ({ category: name, count: count as number }))

  const fuelData = Object.entries(
    vehicles.reduce((acc: any, v) => { acc[v.fuelType] = (acc[v.fuelType] || 0) + 1; return acc }, {})
  ).map(([name, value]) => ({ name: name.toUpperCase(), value: value as number }))

  const totalMileage = vehicles.reduce((s, v) => s + (v.mileage || 0), 0)
  const avgMileage = vehicles.length > 0 ? Math.round(totalMileage / vehicles.length) : 0
  const totalValue = vehicles.reduce((s, v) => s + (v.currentValue || v.purchasePrice || 0), 0)
  const utilizationRate = vehicles.length > 0 ? Math.round(((vehicles.filter(v => v.status === 'rented' || v.status === 'reserved').length) / vehicles.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Fleet Tracking</h2><p className="text-sm text-muted-foreground">Monitor fleet utilization, mileage, and profitability</p></div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Vehicles', value: vehicles.length, icon: Car, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
          { label: 'Fleet Utilization', value: `${utilizationRate}%`, icon: BarChart3, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
          { label: 'Avg Mileage', value: avgMileage.toLocaleString(), icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
          { label: 'Fleet Value', value: `$${(totalValue / 1000).toFixed(0)}k`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
          { label: 'Fuel Types', value: fuelData.length, icon: Fuel, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground">{s.label}</span><div className={`p-1.5 rounded-md ${s.bg}`}><s.icon className={`h-3.5 w-3.5 ${s.color}`} /></div></div>
              <p className="text-lg font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Vehicle Status Distribution</CardTitle></CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="h-72"><ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><RTooltip /><></></PieChart></ResponsiveContainer></div>
            ) : <div className="flex items-center justify-center h-72 text-muted-foreground text-sm">No data available</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Vehicles by Category</CardTitle></CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <div className="h-72"><ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="category" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" /><YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" /><RTooltip /><Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
            ) : <div className="flex items-center justify-center h-72 text-muted-foreground text-sm">No data available</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Fleet Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {vehicles.slice(0, 15).map((v) => {
              const mileagePct = v.mileage ? Math.min((v.mileage / 200000) * 100, 100) : 0
              return (
                <div key={v.id} className="flex items-center gap-4 p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{v.make} {v.model}</span>
                      <Badge className={`text-[10px] ${v.status === 'available' ? 'bg-emerald-100 text-emerald-800' : v.status === 'rented' ? 'bg-blue-100 text-blue-800' : v.status === 'maintenance' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{v.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{v.vehicleNumber} · {v.registrationNumber} · {v.fuelType}</div>
                  </div>
                  <div className="w-32">
                    <div className="text-xs text-muted-foreground mb-1">Mileage: {v.mileage?.toLocaleString()}</div>
                    <Progress value={mileagePct} className="h-1.5" />
                  </div>
                  <div className="text-right w-24">
                    <div className="text-sm font-medium">${v.dailyRate}/day</div>
                    <div className="text-xs text-muted-foreground">{v.currentLocation || 'N/A'}</div>
                  </div>
                </div>
              )
            })}
            {vehicles.length === 0 && <div className="text-center py-8 text-muted-foreground">No vehicles in fleet</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
