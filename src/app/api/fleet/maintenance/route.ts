import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const where: any = {}
    if (type) where.type = type
    if (status) where.status = status
    const records = await db.maintenanceRecord.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { vehicle: true, jobCard: true, spareParts: true }
    })
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
