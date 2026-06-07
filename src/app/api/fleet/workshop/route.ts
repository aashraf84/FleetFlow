import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const jobCards = await sql`
      SELECT jc.*,
             row_to_json(m.*) as maintenance,
             row_to_json(v.*) as vehicle
      FROM "JobCard" jc
      LEFT JOIN "MaintenanceRecord" m ON jc."maintenanceId" = m.id
      LEFT JOIN "Vehicle" v ON m."vehicleId" = v.id
      ORDER BY jc."createdAt" DESC`

    // Nest vehicle inside maintenance object to match Prisma include shape
    const formatted = (jobCards as any[]).map(jc => ({
      ...jc,
      maintenance: jc.maintenance ? { ...jc.maintenance, vehicle: jc.vehicle } : null,
    })).map(({ vehicle, ...rest }) => rest)

    return NextResponse.json({ data: formatted })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch workshop data' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const jobCard = await db.jobCard.create({ data: body })
    return NextResponse.json({ data: jobCard }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create job card' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const jobCard = await db.jobCard.update({ where: { id }, data })
    return NextResponse.json({ data: jobCard })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update job card' }, { status: 500 })
  }
}
