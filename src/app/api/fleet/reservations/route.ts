import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    let reservations
    if (status) {
      reservations = await sql.query(
        `SELECT r.*, 
                row_to_json(c.*) as customer,
                row_to_json(v.*) as vehicle
         FROM "Reservation" r
         LEFT JOIN "Customer" c ON r."customerId" = c.id
         LEFT JOIN "Vehicle" v ON r."vehicleId" = v.id
         WHERE r.status = $1
         ORDER BY r."createdAt" DESC`,
        [status]
      )
    } else {
      reservations = await sql`
        SELECT r.*, 
               row_to_json(c.*) as customer,
               row_to_json(v.*) as vehicle
        FROM "Reservation" r
        LEFT JOIN "Customer" c ON r."customerId" = c.id
        LEFT JOIN "Vehicle" v ON r."vehicleId" = v.id
        ORDER BY r."createdAt" DESC`
    }

    return NextResponse.json({ data: reservations })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 })
  }
}

const RESERVATION_FIELDS = [
  'reservationCode', 'customerId', 'vehicleId', 'startDate', 'endDate',
  'pickupLocation', 'returnLocation', 'totalAmount', 'depositAmount',
  'status', 'notes', 'tenantId',
] as const

function pickReservationFields(body: Record<string, any>) {
  const data: Record<string, any> = {}
  for (const key of RESERVATION_FIELDS) {
    if (body[key] !== undefined && body[key] !== '') {
      data[key] = body[key]
    }
  }
  return data
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const code = `RES-${Date.now().toString(36).toUpperCase()}`
    const data = pickReservationFields(body)
    const reservation = await db.reservation.create({ data: { ...data, reservationCode: code } })
    return NextResponse.json({ data: reservation }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    const data = pickReservationFields(rest)
    const reservation = await db.reservation.update({ where: { id }, data })
    return NextResponse.json({ data: reservation })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update reservation' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.reservation.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete reservation' }, { status: 500 })
  }
}
