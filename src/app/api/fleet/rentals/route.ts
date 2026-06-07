import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    if (status) {
      const contracts = await sql.query(
        `SELECT rc.*,
                row_to_json(c.*) as customer,
                row_to_json(v.*) as vehicle,
                row_to_json(r.*) as reservation
         FROM "RentalContract" rc
         LEFT JOIN "Customer" c ON rc."customerId" = c.id
         LEFT JOIN "Vehicle" v ON rc."vehicleId" = v.id
         LEFT JOIN "Reservation" r ON rc."reservationId" = r.id
         WHERE rc.status = $1
         ORDER BY rc."createdAt" DESC`,
        [status]
      )
      return NextResponse.json({ data: contracts })
    }

    const contracts = await sql`
      SELECT rc.*,
             row_to_json(c.*) as customer,
             row_to_json(v.*) as vehicle,
             row_to_json(r.*) as reservation
      FROM "RentalContract" rc
      LEFT JOIN "Customer" c ON rc."customerId" = c.id
      LEFT JOIN "Vehicle" v ON rc."vehicleId" = v.id
      LEFT JOIN "Reservation" r ON rc."reservationId" = r.id
      ORDER BY rc."createdAt" DESC`

    return NextResponse.json({ data: contracts })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const num = `CTR-${Date.now().toString(36).toUpperCase()}`
    const contract = await db.rentalContract.create({ data: { ...body, contractNumber: num } })
    return NextResponse.json({ data: contract }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const contract = await db.rentalContract.update({ where: { id }, data })
    return NextResponse.json({ data: contract })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 })
  }
}
