import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const orders = await sql`
      SELECT do.*,
             row_to_json(d.*) as driver,
             COALESCE(
               (SELECT json_agg(row_to_json(t.*)) FROM "Trip" t WHERE t."dispatchOrderId" = do.id),
               '[]'::json
             ) as trips
      FROM "DispatchOrder" do
      LEFT JOIN "Driver" d ON do."driverId" = d.id
      ORDER BY do."createdAt" DESC`

    return NextResponse.json({ data: orders })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dispatch orders' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const num = `DSP-${Date.now().toString(36).toUpperCase()}`
    const order = await db.dispatchOrder.create({ data: { ...body, orderNumber: num } })
    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create dispatch order' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const order = await db.dispatchOrder.update({ where: { id }, data })
    return NextResponse.json({ data: order })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update dispatch order' }, { status: 500 })
  }
}
