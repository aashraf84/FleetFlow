import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const trips = await sql`
      SELECT t.*,
             row_to_json(do.*) as "dispatchOrder",
             row_to_json(d.*) as driver,
             COALESCE(
               (SELECT json_agg(row_to_json(fr.*)) FROM "FuelRecord" fr WHERE fr."tripId" = t.id),
               '[]'::json
             ) as "fuelRecords"
      FROM "Trip" t
      LEFT JOIN "DispatchOrder" do ON t."dispatchOrderId" = do.id
      LEFT JOIN "Driver" d ON t."driverId" = d.id
      ORDER BY t."createdAt" DESC`

    return NextResponse.json({ data: trips })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const trip = await db.trip.create({ data: body })
    return NextResponse.json({ data: trip }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const trip = await db.trip.update({ where: { id }, data })
    return NextResponse.json({ data: trip })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 })
  }
}
