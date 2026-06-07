import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [
      totalVehicles,
      activeRentals,
      reservedVehicles,
      vehiclesInService,
      maintenanceDue,
      activeDrivers,
      fuelRecords,
      expenses,
      reservations,
      revenue,
      vehicles,
      clients,
      subscriptions,
    ] = await Promise.all([
      db.vehicle.count(),
      db.reservation.count({ where: { status: 'active' } }),
      db.vehicle.count({ where: { status: 'reserved' } }),
      db.vehicle.count({ where: { status: 'in_service' } }),
      db.maintenanceRecord.count({ where: { status: 'scheduled' } }),
      db.driver.count({ where: { status: 'active' } }),
      db.fuelRecord.findMany({ take: 100 }),
      db.expense.findMany({ take: 100 }),
      db.reservation.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { customer: true, vehicle: true } }),
      db.revenue.findMany({ take: 200 }),
      db.vehicle.findMany(),
      db.client.findMany(),
      db.subscription.findMany(),
    ])

    const rentedVehicles = vehicles.filter(v => v.status === 'rented').length
    const fleetUtilization = totalVehicles > 0 ? Math.round(((activeRentals + rentedVehicles) / totalVehicles) * 100) : 0
    const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0)
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const fuelCosts = fuelRecords.reduce((s, f) => s + f.totalCost, 0)

    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyRevenue = revenue.filter(r => new Date(r.date) >= thisMonth).reduce((s, r) => s + r.amount, 0)
    const outstandingPayments = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0)

    // Revenue by month for chart
    const revenueByMonth: Record<string, number> = {}
    revenue.forEach(r => {
      const d = new Date(r.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      revenueByMonth[key] = (revenueByMonth[key] || 0) + r.amount
    })
    const revenueTrend = Object.entries(revenueByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, amount]) => ({ month, amount: Math.round(amount) }))

    // Fleet utilization by status
    const statusCounts: Record<string, number> = {}
    vehicles.forEach(v => {
      statusCounts[v.status] = (statusCounts[v.status] || 0) + 1
    })
    const fleetUtilizationChart = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
    }))

    // Rental activity by month
    const reservationsByMonth: Record<string, number> = {}
    const allReservations = await db.reservation.findMany()
    allReservations.forEach(r => {
      const d = new Date(r.startDate)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      reservationsByMonth[key] = (reservationsByMonth[key] || 0) + 1
    })
    const rentalActivity = Object.entries(reservationsByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({ month, count }))

    // Upcoming maintenance
    const upcomingMaintenance = await db.maintenanceRecord.findMany({
      where: { status: { in: ['scheduled', 'in_progress'] } },
      take: 8,
      orderBy: { scheduledDate: 'asc' },
      include: { vehicle: true },
    })

    // Recent reservations
    const recentReservations = reservations.map(r => ({
      id: r.id,
      code: r.reservationCode,
      customer: `${r.customer.firstName} ${r.customer.lastName}`,
      vehicle: `${r.vehicle.make} ${r.vehicle.model}`,
      startDate: r.startDate,
      endDate: r.endDate,
      amount: r.totalAmount,
      status: r.status,
    }))

    // Vehicle status distribution
    const vehicleStatusDist = Object.entries(statusCounts).map(([status, count]) => ({
      status: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count,
    }))

    // Client stats
    const activeClients = clients.filter(c => c.status === 'active').length
    const newThisMonth = clients.filter(c => new Date(c.createdAt) >= thisMonth).length

    return NextResponse.json({
      data: {
        stats: {
          totalVehicles,
          activeRentals,
          reservedVehicles,
          fleetUtilization,
          totalRevenue: Math.round(totalRevenue),
          totalExpenses: Math.round(totalExpenses),
          activeDrivers,
          maintenanceDue,
          vehiclesInService,
          fuelCosts: Math.round(fuelCosts),
          outstandingPayments: Math.round(outstandingPayments),
          monthlyRevenue: Math.round(monthlyRevenue),
          activeClients,
          newThisMonth,
          totalSubscriptions: subscriptions.length,
        },
        revenueTrend,
        fleetUtilizationChart,
        rentalActivity,
        recentReservations,
        upcomingMaintenance: upcomingMaintenance.map(m => ({
          id: m.id,
          vehicle: `${m.vehicle.make} ${m.vehicle.model}`,
          type: m.type,
          category: m.category,
          scheduledDate: m.scheduledDate,
          status: m.status,
          cost: m.cost,
        })),
        vehicleStatusDist,
      }
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
