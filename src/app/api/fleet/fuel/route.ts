import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    if (status) {
      const records = await sql.query(
        `SELECT fr.*,
                row_to_json(v.*) as vehicle,
                row_to_json(d.*) as driver
         FROM "FuelRecord" fr
         LEFT JOIN "Vehicle" v ON fr."vehicleId" = v.id
         LEFT JOIN "Driver" d ON fr."driverId" = d.id
         WHERE fr.status = $1
         ORDER BY fr.date DESC`,
        [status]
      )
      return NextResponse.json({ data: records })
    }

    const records = await sql`
      SELECT fr.*,
             row_to_json(v.*) as vehicle,
             row_to_json(d.*) as driver
      FROM "FuelRecord" fr
      LEFT JOIN "Vehicle" v ON fr."vehicleId" = v.id
      LEFT JOIN "Driver" d ON fr."driverId" = d.id
      ORDER BY fr.date DESC`

    return NextResponse.json({ data: records })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fuel records' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const record = await db.fuelRecord.create({ data: body })
    return NextResponse.json({ data: record }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create fuel record' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const record = await db.fuelRecord.update({ where: { id }, data })
    return NextResponse.json({ data: record })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update fuel record' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.fuelRecord.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete fuel record' }, { status: 500 })
  }
}
