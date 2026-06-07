import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const department = searchParams.get('department')
    const status = searchParams.get('status')
    const where: any = {}
    if (department) where.department = department
    if (status) where.status = status
    const employees = await db.employee.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { attendance: { take: 7, orderBy: { date: 'desc' } }, leaveRecords: { take: 5, orderBy: { createdAt: 'desc' } } }
    })
    return NextResponse.json({ data: employees })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const employee = await db.employee.create({ data: body })
    return NextResponse.json({ data: employee }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const employee = await db.employee.update({ where: { id }, data })
    return NextResponse.json({ data: employee })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.employee.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
  }
}
