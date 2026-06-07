'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PieChart as RPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from 'recharts'
import { PieChart, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6', '#06b6d4']

export default function ReportsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])
  const fetchData = async () => {
    setLoading(true)
    try { const res = await fetch('/api/fleet/reports?XTransformPort=3000'); if (res.ok) { const j = await res.json(); setData(j.data) } } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const exportCSV = () => {
    if (!data) return
    const csv = Object.entries(data.summary || {}).map(([k, v]) => `${k},${v}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'fleetflow-report.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading || !data) return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading reports...</div>

  const s = data.summary || {}
  const vb = data.vehicleBreakdown || {}
  const fmv = data.fuelByVehicle || []
  const mbc = data.maintenanceByCategory || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Reports & Analytics</h2><p className="text-sm text-muted-foreground">Comprehensive fleet analytics and exportable reports</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Vehicles', value: s.totalVehicles, color: 'text-emerald-600' },
          { label: 'Revenue', value: `$${s.totalRevenue?.toLocaleString()}`, color: 'text-green-600' },
          { label: 'Expenses', value: `$${s.totalExpenses?.toLocaleString()}`, color: 'text-red-600' },
          { label: 'Net Profit', value: `$${s.netProfit?.toLocaleString()}`, color: 'text-blue-600' },
          { label: 'Utilization', value: `${s.utilizationRate}%`, color: 'text-violet-600' },
        ].map(c => <Card key={c.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{c.label}</p><p className={`text-lg font-bold ${c.color}`}>{c.value}</p></CardContent></Card>)}
      </div>

      <Tabs defaultValue="fleet">
        <TabsList><TabsTrigger value="fleet">Fleet Utilization</TabsTrigger><TabsTrigger value="fuel">Fuel Costs</TabsTrigger><TabsTrigger value="maintenance">Maintenance</TabsTrigger></TabsList>
        <TabsContent value="fleet">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Vehicle Status Breakdown</CardTitle></CardHeader>
              <CardContent>
                {Object.keys(vb).length > 0 ? (
                  <div className="h-64"><ResponsiveContainer width="100%" height="100%">
                    <RPieChart><Pie data={Object.entries(vb).map(([name, value]) => ({ name: name.replace('_', ' '), value }))} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {Object.entries(vb).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><RTooltip /></RPieChart></ResponsiveContainer></div>
                ) : <div className="flex items-center justify-center h-64 text-muted-foreground">No data</div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Summary Statistics</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(s).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-sm font-medium">{typeof value === 'number' ? (key.toLowerCase().includes('revenue') || key.toLowerCase().includes('expense') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('profit') ? `$${value.toLocaleString()}` : value.toLocaleString()) : String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="fuel">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Fuel Cost by Vehicle</CardTitle></CardHeader>
            <CardContent>
              {fmv.length > 0 ? (
                <div className="h-64"><ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fmv}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="vehicle" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" /><YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" /><RTooltip /><Bar dataKey="cost" fill="#f59e0b" radius={[4, 4, 0, 0]} /></BarChart>
                </ResponsiveContainer></div>
              ) : <div className="flex items-center justify-center h-64 text-muted-foreground">No fuel data</div>}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="maintenance">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Maintenance Cost by Category</CardTitle></CardHeader>
            <CardContent>
              {mbc.length > 0 ? (
                <div className="h-64"><ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mbc}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="category" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" /><YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" /><RTooltip /><Bar dataKey="cost" fill="#6366f1" radius={[4, 4, 0, 0]} /></BarChart>
                </ResponsiveContainer></div>
              ) : <div className="flex items-center justify-center h-64 text-muted-foreground">No maintenance data</div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
