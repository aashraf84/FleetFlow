import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const inspections = await sql`
      SELECT vi.*, row_to_json(v.*) as vehicle
      FROM "VehicleInspection" vi
      LEFT JOIN "Vehicle" v ON vi."vehicleId" = v.id
      ORDER BY vi."inspectionDate" DESC`

    return NextResponse.json({ data: inspections })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const inspection = await db.vehicleInspection.create({ data: body })
    return NextResponse.json({ data: inspection }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create inspection' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const inspection = await db.vehicleInspection.update({ where: { id }, data })
    return NextResponse.json({ data: inspection })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inspection' }, { status: 500 })
  }
}
