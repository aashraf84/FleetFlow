import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get('employeeId')
    const period = searchParams.get('period')
    const status = searchParams.get('status')
    const where: any = {}
    if (employeeId) where.employeeId = employeeId
    if (period) where.period = period
    if (status) where.status = status

    const records = await db.payrollRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true, salary: true } } },
    })
    return NextResponse.json({ data: records })
  } catch (error) {
    console.error('Payroll GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch payroll records' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { employeeId, period, baseSalary, overtime, bonuses, deductions, notes } = body

    if (!employeeId || !period) {
      return NextResponse.json({ error: 'employeeId and period are required' }, { status: 400 })
    }

    const base = parseFloat(baseSalary) || 0
    const ot = parseFloat(overtime) || 0
    const bon = parseFloat(bonuses) || 0
    const ded = parseFloat(deductions) || 0
    const netPay = Math.round((base + ot + bon - ded) * 100) / 100

    const record = await db.payrollRecord.create({
      data: {
        employeeId,
        period,
        baseSalary: base,
        overtime: ot,
        bonuses: bon,
        deductions: ded,
        netPay,
        status: 'pending',
        notes: notes || null,
      },
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true, salary: true } } },
    })
    return NextResponse.json({ data: record }, { status: 201 })
  } catch (error) {
    console.error('Payroll POST error:', error)
    return NextResponse.json({ error: 'Failed to create payroll record' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Recalculate netPay if salary components change
    if (data.baseSalary !== undefined || data.overtime !== undefined || data.bonuses !== undefined || data.deductions !== undefined) {
      // Fetch existing record to get current values
      const existing = await db.payrollRecord.findUnique({ where: { id } })
      if (existing) {
        const base = parseFloat(data.baseSalary) ?? existing.baseSalary
        const ot = parseFloat(data.overtime) ?? existing.overtime
        const bon = parseFloat(data.bonuses) ?? existing.bonuses
        const ded = parseFloat(data.deductions) ?? existing.deductions
        data.netPay = Math.round((base + ot + bon - ded) * 100) / 100
      }
    }

    // Handle status transitions
    if (data.status === 'paid' && !data.paidDate) {
      data.paidDate = new Date()
    }

    const record = await db.payrollRecord.update({
      where: { id },
      data,
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true, salary: true } } },
    })
    return NextResponse.json({ data: record })
  } catch (error) {
    console.error('Payroll PUT error:', error)
    return NextResponse.json({ error: 'Failed to update payroll record' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.payrollRecord.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payroll DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete payroll record' }, { status: 500 })
  }
}
