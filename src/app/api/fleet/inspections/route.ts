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

const VEHICLE_INSPECTION_FIELDS = [
  'vehicleId', 'inspectionDate', 'inspector', 'type', 'overallCondition',
  'exteriorCondition', 'interiorCondition', 'engineCondition', 'tireCondition',
  'brakesCondition', 'notes', 'issues', 'photos', 'status',
  'nextInspectionDate', 'tenantId',
] as const

function pickInspectionFields(body: Record<string, any>) {
  const data: Record<string, any> = {}
  for (const key of VEHICLE_INSPECTION_FIELDS) {
    if (body[key] !== undefined && body[key] !== '') {
      data[key] = body[key]
    }
  }
  return data
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.vehicleId) {
      return NextResponse.json({ error: 'vehicleId is required' }, { status: 400 })
    }
    const data = pickInspectionFields(body)
    const inspection = await db.vehicleInspection.create({ data })
    return NextResponse.json({ data: inspection }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create inspection' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    const data = pickInspectionFields(rest)
    // Convert date fields if present
    if (data.inspectionDate) data.inspectionDate = new Date(data.inspectionDate)
    if (data.nextInspectionDate) data.nextInspectionDate = new Date(data.nextInspectionDate)
    const inspection = await db.vehicleInspection.update({ where: { id }, data })
    return NextResponse.json({ data: inspection })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inspection' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    await db.vehicleInspection.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete inspection' }, { status: 500 })
  }
}
