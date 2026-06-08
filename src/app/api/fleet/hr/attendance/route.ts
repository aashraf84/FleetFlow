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

    const records = await db.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true } } },
    })
    return NextResponse.json({ data: records })
  } catch (error) {
    console.error('Attendance GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance records' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { employeeId, date, checkIn, checkOut, status, notes } = body

    if (!employeeId || !date) {
      return NextResponse.json({ error: 'employeeId and date are required' }, { status: 400 })
    }

    // Calculate hours worked if both checkIn and checkOut are provided
    let hoursWorked = 0
    if (checkIn && checkOut) {
      const inTime = new Date(checkIn)
      const outTime = new Date(checkOut)
      hoursWorked = Math.round(((outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60)) * 100) / 100
    }

    const record = await db.attendance.create({
      data: {
        employeeId,
        date: new Date(date),
        checkIn: checkIn ? new Date(checkIn) : null,
        checkOut: checkOut ? new Date(checkOut) : null,
        hoursWorked,
        status: status || 'present',
        notes: notes || null,
      },
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true } } },
    })
    return NextResponse.json({ data: record }, { status: 201 })
  } catch (error) {
    console.error('Attendance POST error:', error)
    return NextResponse.json({ error: 'Failed to create attendance record' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Recalculate hours if checkIn and checkOut are both present
    if (data.checkIn && data.checkOut) {
      const inTime = new Date(data.checkIn)
      const outTime = new Date(data.checkOut)
      data.hoursWorked = Math.round(((outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60)) * 100) / 100
    }

    // Convert date strings to Date objects
    if (data.date) data.date = new Date(data.date)
    if (data.checkIn) data.checkIn = new Date(data.checkIn)
    if (data.checkOut) data.checkOut = new Date(data.checkOut)

    const record = await db.attendance.update({
      where: { id },
      data,
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true } } },
    })
    return NextResponse.json({ data: record })
  } catch (error) {
    console.error('Attendance PUT error:', error)
    return NextResponse.json({ error: 'Failed to update attendance record' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.attendance.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Attendance DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete attendance record' }, { status: 500 })
  }
}
