import { NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

export async function GET() {
  try {
    // 3 parallel HTTP queries — fetch vehicles, invoices, and expenses
    const [vehicles, invoices, expenses] = await Promise.all([
      sql`SELECT id, make, model, status FROM "Vehicle"`,
      sql`SELECT "totalAmount" FROM "Invoice"`,
      sql`SELECT amount, category FROM "Expense"`,
    ])

    const totalRevenue = (invoices as any[]).reduce((s, i) => s + i.totalAmount, 0)
    const totalExpenses = (expenses as any[]).reduce((s, e) => s + e.amount, 0)

    // Estimate fuel & maintenance costs from expense categories
    const totalFuelCost = (expenses as any[]).filter(e => e.category === 'fuel').reduce((s, e) => s + e.amount, 0)
    const totalMaintenanceCost = (expenses as any[]).filter(e => e.category === 'maintenance').reduce((s, e) => s + e.amount, 0)

    // Estimate active drivers from vehicle assignments
    const rentedVehicles = (vehicles as any[]).filter(v => v.status === 'rented' || v.status === 'in_service')
    const estimatedActiveDrivers = rentedVehicles.length

    return NextResponse.json({
      data: {
        summary: {
          totalVehicles: (vehicles as any[]).length,
          totalReservations: (vehicles as any[]).filter(v => v.status === 'reserved').length,
          totalRevenue: Math.round(totalRevenue),
          totalExpenses: Math.round(totalExpenses),
          netProfit: Math.round(totalRevenue - totalExpenses),
          totalFuelCost: Math.round(totalFuelCost),
          totalMaintenanceCost: Math.round(totalMaintenanceCost),
          activeDrivers: estimatedActiveDrivers,
          utilizationRate: (vehicles as any[]).length > 0 ? Math.round(((vehicles as any[]).filter(v => v.status === 'rented' || v.status === 'reserved').length / (vehicles as any[]).length) * 100) : 0,
        },
        vehicleBreakdown: {
          available: (vehicles as any[]).filter(v => v.status === 'available').length,
          rented: (vehicles as any[]).filter(v => v.status === 'rented').length,
          reserved: (vehicles as any[]).filter(v => v.status === 'reserved').length,
          maintenance: (vehicles as any[]).filter(v => v.status === 'maintenance').length,
          inService: (vehicles as any[]).filter(v => v.status === 'in_service').length,
          retired: (vehicles as any[]).filter(v => v.status === 'retired').length,
        },
        fuelByVehicle: (vehicles as any[]).slice(0, 20).map(v => ({
          vehicle: `${v.make} ${v.model}`,
          cost: (expenses as any[]).filter(e => e.category === 'fuel').reduce((share, e) => {
            return share + Math.round(e.amount / Math.max((vehicles as any[]).length, 1))
          }, 0)
        })),
        maintenanceByCategory: (() => {
          const cats: Record<string, number> = {}
          ;(expenses as any[]).filter(e => e.category === 'maintenance' || e.category === 'repair' || e.category === 'service').forEach(e => {
            cats[e.category] = (cats[e.category] || 0) + e.amount
          })
          return Object.entries(cats).map(([category, cost]) => ({ category, cost }))
        })(),
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
