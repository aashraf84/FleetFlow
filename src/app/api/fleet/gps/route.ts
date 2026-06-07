import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const locations = await db.gpsLocation.findMany({ orderBy: { timestamp: 'desc' }, take: 100, include: { vehicle: true } })
    const vehicles = await db.vehicle.findMany({ select: { id: true, vehicleNumber: true, make: true, model: true, status: true, currentLocation: true } })
    return NextResponse.json({ data: { locations, vehicles } })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch GPS data' }, { status: 500 })
  }
}
