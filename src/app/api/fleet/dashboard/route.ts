import { NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

export async function GET() {
  try {
    // 8 parallel HTTP-based queries — all real data from DB
    const [vehicles, reservations, revenues, maintenanceDue, drivers, clients, expenses, subscriptions] = await Promise.all([
      sql`SELECT id, make, model, status, "dailyRate" FROM "Vehicle"`,
      sql`SELECT r.id, r."reservationCode", r."customerId", r."vehicleId", r."startDate", r."endDate", r."totalAmount", r.status,
                 c."firstName" as "customerFirstName", c."lastName" as "customerLastName",
                 v.make as "vehicleMake", v.model as "vehicleModel"
          FROM "Reservation" r
          LEFT JOIN "Customer" c ON r."customerId" = c.id
          LEFT JOIN "Vehicle" v ON r."vehicleId" = v.id
          ORDER BY r."createdAt" DESC LIMIT 10`,
      sql`SELECT amount, date, category FROM "Revenue"`,
      sql`SELECT m.id, m.type, m.category, m."scheduledDate", m.status, m.cost,
                 v.make as "vehicleMake", v.model as "vehicleModel"
          FROM "MaintenanceRecord" m
          LEFT JOIN "Vehicle" v ON m."vehicleId" = v.id
          WHERE m.status IN ('scheduled', 'in_progress')
          ORDER BY m."scheduledDate" ASC LIMIT 8`,
      sql`SELECT id FROM "Driver" WHERE status = 'active'`,
      sql`SELECT id, "createdAt" FROM "Client" WHERE status = 'active'`,
      sql`SELECT amount, category FROM "Expense"`,
      sql`SELECT id FROM "Subscription" WHERE status = 'active'`,
    ])

    // Compute everything from the queries above
    const totalVehicles = vehicles.length
    const statusCounts: Record<string, number> = {}
    vehicles.forEach((v: any) => { statusCounts[v.status] = (statusCounts[v.status] || 0) + 1 })

    const activeRentals = reservations.filter((r: any) => r.status === 'active').length
    const rentedVehicles = statusCounts['rented'] || 0
    const reservedVehicles = statusCounts['reserved'] || 0
    const vehiclesInService = statusCounts['in_service'] || 0
    const fleetUtilization = totalVehicles > 0 ? Math.round(((activeRentals + rentedVehicles) / totalVehicles) * 100) : 0

    const totalRevenue = revenues.reduce((s: number, r: any) => s + r.amount, 0)

    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyRevenue = revenues.filter((r: any) => new Date(r.date) >= thisMonth).reduce((s: number, r: any) => s + r.amount, 0)

    // Real expense data from DB
    const totalExpenses = expenses.reduce((s: number, e: any) => s + e.amount, 0)
    const fuelCosts = expenses.filter((e: any) => e.category === 'fuel').reduce((s: number, e: any) => s + e.amount, 0)

    // Real driver/client/subscription counts from DB
    const activeDrivers = drivers.length
    const activeClients = clients.length
    const newThisMonth = clients.filter((c: any) => new Date(c.createdAt) >= thisMonth).length
    const totalSubscriptions = subscriptions.length
    const maintenanceDueCount = maintenanceDue.length

    // Calculate outstanding payments from unpaid invoice amounts
    let outstandingPayments = 0
    try {
      const unpaidInvoices = await sql`SELECT ("totalAmount" - "paidAmount") as outstanding FROM "Invoice" WHERE status IN ('sent', 'partial', 'overdue')`
      outstandingPayments = unpaidInvoices.reduce((s: number, i: any) => s + (i.outstanding || 0), 0)
    } catch {
      outstandingPayments = 0
    }

    // Revenue trend by month
    const revenueByMonth: Record<string, number> = {}
    revenues.forEach((r: any) => {
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

    // Rental activity from reservations already fetched
    const reservationsByMonth: Record<string, number> = {}
    reservations.forEach((r: any) => {
      const d = new Date(r.startDate)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      reservationsByMonth[key] = (reservationsByMonth[key] || 0) + 1
    })
    const rentalActivity = Object.entries(reservationsByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({ month, count }))

    const recentReservations = reservations.map((r: any) => ({
      id: r.id,
      code: r.reservationCode,
      customer: `${r.customerFirstName} ${r.customerLastName}`,
      vehicle: `${r.vehicleMake} ${r.vehicleModel}`,
      startDate: r.startDate,
      endDate: r.endDate,
      amount: r.totalAmount,
      status: r.status,
    }))

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
          maintenanceDue: maintenanceDueCount,
          vehiclesInService,
          fuelCosts: Math.round(fuelCosts),
          outstandingPayments: Math.round(outstandingPayments),
          monthlyRevenue: Math.round(monthlyRevenue),
          activeClients,
          newThisMonth,
          totalSubscriptions,
        },
        revenueTrend,
        fleetUtilizationChart,
        rentalActivity,
        recentReservations,
        upcomingMaintenance: maintenanceDue.map((m: any) => ({
          id: m.id,
          vehicle: `${m.vehicleMake} ${m.vehicleModel}`,
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
