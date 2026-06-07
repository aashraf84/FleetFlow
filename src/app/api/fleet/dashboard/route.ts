import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Use fewer, more efficient queries to avoid overwhelming Neon connection pool
    // Instead of 13+ concurrent queries, batch into 3-4 efficient ones
    
    const [vehicles, reservations, revenue, expenses] = await Promise.all([
      db.vehicle.findMany({ select: { id: true, make: true, model: true, status: true } }),
      db.reservation.findMany({ 
        take: 10, orderBy: { createdAt: 'desc' }, 
        include: { customer: { select: { firstName: true, lastName: true } }, vehicle: { select: { make: true, model: true } } }
      }),
      db.revenue.findMany({ take: 200 }),
      db.expense.findMany({ take: 100 }),
    ])

    // Compute stats from the fetched data
    const totalVehicles = vehicles.length
    const statusCounts: Record<string, number> = {}
    vehicles.forEach(v => { statusCounts[v.status] = (statusCounts[v.status] || 0) + 1 })
    
    const activeRentals = reservations.filter(r => r.status === 'active').length
    const reservedVehicles = statusCounts['reserved'] || 0
    const vehiclesInService = statusCounts['in_service'] || 0
    const rentedVehicles = statusCounts['rented'] || 0
    const fleetUtilization = totalVehicles > 0 ? Math.round(((activeRentals + rentedVehicles) / totalVehicles) * 100) : 0
    
    const totalRevenue = revenue.reduce((s, r) => s + r.amount, 0)
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const fuelCosts = 0 // computed separately if needed
    const outstandingPayments = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0)

    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyRevenue = revenue.filter(r => new Date(r.date) >= thisMonth).reduce((s, r) => s + r.amount, 0)

    // Revenue trend
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

    // Fleet utilization chart
    const fleetUtilizationChart = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: count,
    }))

    // Rental activity - from existing reservations data
    const allReservations = await db.reservation.findMany({ select: { startDate: true } })
    const reservationsByMonth: Record<string, number> = {}
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
      include: { vehicle: { select: { make: true, model: true } } },
    })

    // Additional stats
    const [activeDrivers, maintenanceDue] = await Promise.all([
      db.driver.count({ where: { status: 'active' } }),
      db.maintenanceRecord.count({ where: { status: 'scheduled' } }),
    ])

    const clientCount = await db.client.count({ where: { status: 'active' } })
    const newThisMonth = await db.client.count({ where: { createdAt: { gte: thisMonth } } })
    const subscriptionCount = await db.subscription.count()

    // Recent reservations format
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
          activeClients: clientCount,
          newThisMonth,
          totalSubscriptions: subscriptionCount,
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
