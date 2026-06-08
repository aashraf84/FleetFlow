import { NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

export async function GET() {
  try {
    // 5 parallel HTTP queries — fetch vehicles, invoices, expenses, fuel records, and maintenance
    const [vehicles, invoices, expenses, fuelRecords, maintenanceRecords] = await Promise.all([
      sql`SELECT id, make, model, status FROM "Vehicle"`,
      sql`SELECT "totalAmount", "paidAmount", status FROM "Invoice"`,
      sql`SELECT amount, category FROM "Expense"`,
      sql`SELECT f."vehicleId", f."totalCost", v.make, v.model
           FROM "FuelRecord" f
           LEFT JOIN "Vehicle" v ON f."vehicleId" = v.id`,
      sql`SELECT m."vehicleId", m.cost, m.category, v.make, v.model
           FROM "MaintenanceRecord" m
           LEFT JOIN "Vehicle" v ON m."vehicleId" = v.id`,
    ])

    const totalRevenue = (invoices as any[]).reduce((s, i) => s + i.totalAmount, 0)
    const totalExpenses = (expenses as any[]).reduce((s, e) => s + e.amount, 0)

    // Real fuel & maintenance costs from expense categories
    const totalFuelCost = (expenses as any[]).filter(e => e.category === 'fuel').reduce((s, e) => s + e.amount, 0)
    const totalMaintenanceCost = (expenses as any[]).filter(e => e.category === 'maintenance').reduce((s, e) => s + e.amount, 0)

    // Per-vehicle fuel costs from actual FuelRecord data
    const fuelByVehicleMap: Record<string, { vehicle: string; cost: number }> = {}
    ;(fuelRecords as any[]).forEach((f) => {
      const key = f.vehicleId || 'unknown'
      const name = f.make && f.model ? `${f.make} ${f.model}` : 'Unknown Vehicle'
      if (!fuelByVehicleMap[key]) {
        fuelByVehicleMap[key] = { vehicle: name, cost: 0 }
      }
      fuelByVehicleMap[key].cost += f.totalCost || 0
    })
    const fuelByVehicle = Object.values(fuelByVehicleMap)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 20)

    // Per-vehicle maintenance costs from actual MaintenanceRecord data
    const maintenanceByCategoryMap: Record<string, number> = {}
    ;(maintenanceRecords as any[]).forEach((m) => {
      const cat = m.category || 'other'
      maintenanceByCategoryMap[cat] = (maintenanceByCategoryMap[cat] || 0) + (m.cost || 0)
    })
    const maintenanceByCategory = Object.entries(maintenanceByCategoryMap).map(([category, cost]) => ({ category, cost: Math.round(cost) }))

    // Real active drivers from DB
    let activeDrivers = 0
    try {
      const driverResult = await sql`SELECT COUNT(*)::int as count FROM "Driver" WHERE status = 'active'`
      activeDrivers = driverResult[0]?.count || 0
    } catch {
      const rentedVehicles = (vehicles as any[]).filter(v => v.status === 'rented' || v.status === 'in_service')
      activeDrivers = rentedVehicles.length
    }

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
          activeDrivers,
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
        fuelByVehicle,
        maintenanceByCategory,
      }
    })
  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
