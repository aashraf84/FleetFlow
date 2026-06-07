import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const vehicles = await db.vehicle.findMany()
    const reservations = await db.reservation.findMany()
    const fuelRecords = await db.fuelRecord.findMany()
    const maintenanceRecords = await db.maintenanceRecord.findMany()
    const expenses = await db.expense.findMany()
    const invoices = await db.invoice.findMany()
    const drivers = await db.driver.findMany()

    const totalRevenue = invoices.reduce((s, i) => s + i.totalAmount, 0)
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const totalFuelCost = fuelRecords.reduce((s, f) => s + f.totalCost, 0)
    const totalMaintenanceCost = maintenanceRecords.reduce((s, m) => s + m.cost, 0)

    return NextResponse.json({
      data: {
        summary: {
          totalVehicles: vehicles.length,
          totalReservations: reservations.length,
          totalRevenue: Math.round(totalRevenue),
          totalExpenses: Math.round(totalExpenses),
          netProfit: Math.round(totalRevenue - totalExpenses),
          totalFuelCost: Math.round(totalFuelCost),
          totalMaintenanceCost: Math.round(totalMaintenanceCost),
          activeDrivers: drivers.filter(d => d.status === 'active').length,
          utilizationRate: vehicles.length > 0 ? Math.round((vehicles.filter(v => v.status === 'rented' || v.status === 'reserved').length / vehicles.length) * 100) : 0,
        },
        vehicleBreakdown: {
          available: vehicles.filter(v => v.status === 'available').length,
          rented: vehicles.filter(v => v.status === 'rented').length,
          reserved: vehicles.filter(v => v.status === 'reserved').length,
          maintenance: vehicles.filter(v => v.status === 'maintenance').length,
          inService: vehicles.filter(v => v.status === 'in_service').length,
          retired: vehicles.filter(v => v.status === 'retired').length,
        },
        fuelByVehicle: vehicles.slice(0, 20).map(v => ({
          vehicle: `${v.make} ${v.model}`,
          cost: fuelRecords.filter(f => f.vehicleId === v.id).reduce((s, f) => s + f.totalCost, 0)
        })),
        maintenanceByCategory: (() => {
          const cats: Record<string, number> = {}
          maintenanceRecords.forEach(m => { cats[m.category] = (cats[m.category] || 0) + m.cost })
          return Object.entries(cats).map(([category, cost]) => ({ category, cost }))
        })(),
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
