'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Car, Users, CalendarCheck, BarChart3, DollarSign, TrendingUp, Fuel, Wrench,
  Truck, CreditCard, AlertCircle, ArrowUpRight, ArrowDownRight, Activity, Clock
} from 'lucide-react'
import { AreaChart, Area, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Cell, Legend } from 'recharts'

const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ef4444', '#8b5cf6', '#06b6d4']

interface DashboardData {
  stats: {
    totalVehicles: number
    activeRentals: number
    reservedVehicles: number
    fleetUtilization: number
    totalRevenue: number
    totalExpenses: number
    activeDrivers: number
    maintenanceDue: number
    vehiclesInService: number
    fuelCosts: number
    outstandingPayments: number
    monthlyRevenue: number
    activeClients: number
    newThisMonth: number
  }
  revenueTrend: { month: string; amount: number }[]
  fleetUtilizationChart: { name: string; value: number }[]
  rentalActivity: { month: string; count: number }[]
  recentReservations: {
    id: string; code: string; customer: string; vehicle: string
    startDate: string; endDate: string; amount: number; status: string
  }[]
  upcomingMaintenance: {
    id: string; vehicle: string; type: string; category: string
    scheduledDate: string; status: string; cost: number
  }[]
  vehicleStatusDist: { status: string; count: number }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fleet/dashboard')
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const statCards = data ? [
    { label: 'Total Vehicles', value: data.stats.totalVehicles, icon: Car, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Active Rentals', value: data.stats.activeRentals, icon: CalendarCheck, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Reserved Vehicles', value: data.stats.reservedVehicles, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'Fleet Utilization', value: `${data.stats.fleetUtilization}%`, icon: BarChart3, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
    { label: 'Total Revenue', value: fmt(data.stats.totalRevenue), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { label: 'Expenses', value: fmt(data.stats.totalExpenses), icon: TrendingUp, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
    { label: 'Active Drivers', value: data.stats.activeDrivers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Maintenance Due', value: data.stats.maintenanceDue, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: 'In Service', value: data.stats.vehiclesInService, icon: Activity, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30' },
    { label: 'Fuel Costs', value: fmt(data.stats.fuelCosts), icon: Fuel, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
    { label: 'Outstanding', value: fmt(data.stats.outstandingPayments), icon: CreditCard, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
  ] : []

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {Array.from({ length: 11 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-20 mb-2" />
                <div className="h-6 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-pulse"><CardContent className="p-6"><div className="h-64 bg-muted rounded" /></CardContent></Card>
          <Card className="animate-pulse"><CardContent className="p-6"><div className="h-64 bg-muted rounded" /></CardContent></Card>
        </div>
      </div>
    )
  }

  if (!data) return <div className="text-center text-muted-foreground py-12">Failed to load dashboard data</div>

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
                <div className={`p-1.5 rounded-md ${card.bg}`}>
                  <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over the past year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueTrend}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <RTooltip formatter={(value: number) => [fmt(value), 'Revenue']} />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" fill="url(#revenueGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fleet Utilization Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fleet Utilization</CardTitle>
            <CardDescription>Vehicle status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.fleetUtilizationChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.fleetUtilizationChart.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rental Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Rental Activity</CardTitle>
          <CardDescription>Monthly rental reservations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.rentalActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <RTooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row - Recent Reservations & Upcoming Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reservations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Reservations</CardTitle>
            <CardDescription>Latest rental bookings</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[440px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Code</TableHead>
                    <TableHead className="text-xs">Customer</TableHead>
                    <TableHead className="text-xs">Vehicle</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentReservations.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs font-mono">{r.code}</TableCell>
                      <TableCell className="text-xs">{r.customer}</TableCell>
                      <TableCell className="text-xs">{r.vehicle}</TableCell>
                      <TableCell className="text-xs font-medium">{fmt(r.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          r.status === 'active' ? 'default' :
                          r.status === 'completed' ? 'secondary' :
                          r.status === 'cancelled' ? 'destructive' : 'outline'
                        } className="text-[10px]">
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Upcoming Maintenance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Upcoming Maintenance</CardTitle>
            <CardDescription>Scheduled maintenance tasks</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[440px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Vehicle</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Scheduled</TableHead>
                    <TableHead className="text-xs">Cost</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.upcomingMaintenance.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-xs font-medium">{m.vehicle}</TableCell>
                      <TableCell className="text-xs capitalize">{m.category.replace('_', ' ')}</TableCell>
                      <TableCell className="text-xs">{fmtDate(m.scheduledDate)}</TableCell>
                      <TableCell className="text-xs">{fmt(m.cost)}</TableCell>
                      <TableCell>
                        <Badge variant={m.status === 'in_progress' ? 'default' : 'outline'} className="text-[10px]">
                          {m.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Status Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Vehicle Status Distribution</CardTitle>
          <CardDescription>Current fleet status breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {data.vehicleStatusDist.map((v, i) => {
              const total = data.vehicleStatusDist.reduce((s, x) => s + x.count, 0)
              const pct = total > 0 ? Math.round((v.count / total) * 100) : 0
              return (
                <div key={v.status} className="flex flex-col items-center p-4 rounded-lg border bg-card">
                  <div className="text-2xl font-bold" style={{ color: COLORS[i % COLORS.length] }}>{v.count}</div>
                  <div className="text-xs text-muted-foreground mt-1 capitalize">{v.status}</div>
                  <Progress value={pct} className="h-1.5 mt-2 w-full" />
                  <div className="text-[10px] text-muted-foreground mt-1">{pct}%</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
