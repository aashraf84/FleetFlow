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
    const { maintenanceId, technician, estimatedHours, notes } = body
    if (!maintenanceId) {
      return NextResponse.json({ error: 'maintenanceId is required' }, { status: 400 })
    }
    const jobCard = await db.jobCard.create({
      data: {
        maintenanceId,
        technician: technician || null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : 0,
        notes: notes || null,
        status: 'open',
      }
    })
    return NextResponse.json({ data: jobCard }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create job card' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Auto-calculate totalCost if laborCost or partsCost is provided
    if (data.laborCost !== undefined || data.partsCost !== undefined) {
      const existing = await db.jobCard.findUnique({ where: { id } })
      if (existing) {
        const laborCost = data.laborCost !== undefined ? parseFloat(data.laborCost) : existing.laborCost
        const partsCost = data.partsCost !== undefined ? parseFloat(data.partsCost) : existing.partsCost
        data.totalCost = laborCost + partsCost
      }
    }

    const jobCard = await db.jobCard.update({ where: { id }, data })
    return NextResponse.json({ data: jobCard })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update job card' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }
    // Only allow deleting open job cards
    const jobCard = await db.jobCard.findUnique({ where: { id } })
    if (!jobCard) {
      return NextResponse.json({ error: 'Job card not found' }, { status: 404 })
    }
    if (jobCard.status !== 'open') {
      return NextResponse.json({ error: 'Only open job cards can be deleted' }, { status: 400 })
    }
    await db.jobCard.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete job card' }, { status: 500 })
  }
}
