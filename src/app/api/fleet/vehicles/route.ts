import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    // Build dynamic WHERE clause with parameterized query
    const conditions: string[] = []
    const params: any[] = []
    let idx = 1

    if (status) {
      conditions.push(`status = $${idx++}`)
      params.push(status)
    }
    if (category) {
      conditions.push(`category = $${idx++}`)
      params.push(category)
    }
    if (search) {
      conditions.push(`("vehicleNumber" ILIKE $${idx} OR "registrationNumber" ILIKE $${idx} OR make ILIKE $${idx} OR model ILIKE $${idx} OR vin ILIKE $${idx})`)
      params.push(`%${search}%`)
      idx++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const vehicles = await sql.query(
      `SELECT * FROM "Vehicle" ${whereClause} ORDER BY "createdAt" DESC`,
      params
    )

    return NextResponse.json({ data: vehicles })
  } catch (error) {
    console.error('Vehicles GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 })
  }
}

const VEHICLE_FIELDS = [
  'vehicleNumber', 'registrationNumber', 'make', 'model', 'year',
  'category', 'color', 'vin', 'engineNumber', 'transmission', 'fuelType',
  'mileage', 'status', 'dailyRate', 'weeklyRate', 'monthlyRate',
  'currentLocation', 'lastServiceDate', 'nextServiceDate',
  'insuranceExpiry', 'registrationExpiry', 'notes', 'tenantId',
] as const

function pickVehicleFields(body: Record<string, any>) {
  const data: Record<string, any> = {}
  for (const key of VEHICLE_FIELDS) {
    if (body[key] !== undefined && body[key] !== '') {
      data[key] = body[key]
    }
  }
  return data
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = pickVehicleFields(body)
    const vehicle = await db.vehicle.create({ data })
    return NextResponse.json({ data: vehicle }, { status: 201 })
  } catch (error) {
    console.error('Vehicle POST error:', error)
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    const data = pickVehicleFields(rest)
    const vehicle = await db.vehicle.update({ where: { id }, data })
    return NextResponse.json({ data: vehicle })
  } catch (error) {
    console.error('Vehicle PUT error:', error)
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.vehicle.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Vehicle DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 })
  }
}
