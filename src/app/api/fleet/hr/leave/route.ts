import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')
    const where: any = {}
    if (employeeId) where.employeeId = employeeId
    if (status) where.status = status

    const records = await db.leaveRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true } } },
    })
    return NextResponse.json({ data: records })
  } catch (error) {
    console.error('Leave GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch leave records' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { employeeId, type, startDate, endDate, reason, approvedBy } = body

    if (!employeeId || !type || !startDate || !endDate) {
      return NextResponse.json({ error: 'employeeId, type, startDate, and endDate are required' }, { status: 400 })
    }

    // Calculate days
    const start = new Date(startDate)
    const end = new Date(endDate)
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

    const record = await db.leaveRecord.create({
      data: {
        employeeId,
        type,
        startDate: start,
        endDate: end,
        days,
        status: 'pending',
        reason: reason || null,
        approvedBy: approvedBy || null,
      },
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true } } },
    })
    return NextResponse.json({ data: record }, { status: 201 })
  } catch (error) {
    console.error('Leave POST error:', error)
    return NextResponse.json({ error: 'Failed to create leave record' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Convert date strings to Date objects if present
    if (data.startDate) data.startDate = new Date(data.startDate)
    if (data.endDate) data.endDate = new Date(data.endDate)

    // Recalculate days if dates change
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate)
      const end = new Date(data.endDate)
      data.days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    }

    const record = await db.leaveRecord.update({
      where: { id },
      data,
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true } } },
    })
    return NextResponse.json({ data: record })
  } catch (error) {
    console.error('Leave PUT error:', error)
    return NextResponse.json({ error: 'Failed to update leave record' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.leaveRecord.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Leave DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete leave record' }, { status: 500 })
  }
}
