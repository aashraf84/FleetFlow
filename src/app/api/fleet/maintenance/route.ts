import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const conditions: string[] = []
    const params: any[] = []
    let idx = 1

    if (type) {
      conditions.push(`m.type = $${idx++}`)
      params.push(type)
    }
    if (status) {
      conditions.push(`m.status = $${idx++}`)
      params.push(status)
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Fetch maintenance records with vehicle, jobCard, and spare parts
    const records = await sql.query(
      `SELECT m.*,
              row_to_json(v.*) as vehicle,
              row_to_json(jc.*) as "jobCard",
              COALESCE(
                (SELECT json_agg(json_build_object('id', msp.id, 'quantity', msp.quantity, 'cost', msp.cost, 'sparePart', row_to_json(sp.*)))
                 FROM "MaintenanceSparePart" msp
                 LEFT JOIN "SparePart" sp ON msp."sparePartId" = sp.id
                 WHERE msp."maintenanceId" = m.id),
                '[]'::json
              ) as "spareParts"
       FROM "MaintenanceRecord" m
       LEFT JOIN "Vehicle" v ON m."vehicleId" = v.id
       LEFT JOIN "JobCard" jc ON jc."maintenanceId" = m.id
       ${whereClause}
       ORDER BY m."createdAt" DESC`,
      params
    )

    return NextResponse.json({ data: records })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch maintenance records' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const record = await db.maintenanceRecord.create({ data: body })
    return NextResponse.json({ data: record }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create maintenance record' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const record = await db.maintenanceRecord.update({ where: { id }, data })
    return NextResponse.json({ data: record })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update maintenance record' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.maintenanceRecord.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete maintenance record' }, { status: 500 })
  }
}
