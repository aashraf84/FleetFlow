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
    const { vehicleId, inspectionDate, inspector, type, overallCondition, exteriorCondition, interiorCondition, engineCondition, tireCondition, brakesCondition, notes, issues, status, nextInspectionDate } = body
    if (!vehicleId) {
      return NextResponse.json({ error: 'vehicleId is required' }, { status: 400 })
    }
    const inspection = await db.vehicleInspection.create({
      data: {
        vehicleId,
        inspectionDate: inspectionDate ? new Date(inspectionDate) : new Date(),
        inspector: inspector || null,
        type: type || 'routine',
        overallCondition: overallCondition || 'good',
        exteriorCondition: exteriorCondition || null,
        interiorCondition: interiorCondition || null,
        engineCondition: engineCondition || null,
        tireCondition: tireCondition || null,
        brakesCondition: brakesCondition || null,
        notes: notes || null,
        issues: issues || null,
        status: status || 'passed',
        nextInspectionDate: nextInspectionDate ? new Date(nextInspectionDate) : null,
      }
    })
    return NextResponse.json({ data: inspection }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create inspection' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
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
