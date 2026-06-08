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

    const records = await db.performanceReview.findMany({
      where,
      orderBy: { reviewDate: 'desc' },
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true } } },
    })
    return NextResponse.json({ data: records })
  } catch (error) {
    console.error('Performance GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch performance reviews' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { employeeId, reviewer, period, rating, goals, feedback, strengths, improvements, reviewDate } = body

    if (!employeeId || !reviewer || !period || !reviewDate) {
      return NextResponse.json({ error: 'employeeId, reviewer, period, and reviewDate are required' }, { status: 400 })
    }

    const record = await db.performanceReview.create({
      data: {
        employeeId,
        reviewer,
        period,
        rating: parseFloat(rating) || 0,
        goals: goals || null,
        feedback: feedback || null,
        strengths: strengths || null,
        improvements: improvements || null,
        status: 'draft',
        reviewDate: new Date(reviewDate),
      },
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true } } },
    })
    return NextResponse.json({ data: record }, { status: 201 })
  } catch (error) {
    console.error('Performance POST error:', error)
    return NextResponse.json({ error: 'Failed to create performance review' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    if (data.rating !== undefined) data.rating = parseFloat(data.rating) || 0
    if (data.reviewDate) data.reviewDate = new Date(data.reviewDate)

    const record = await db.performanceReview.update({
      where: { id },
      data,
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeId: true } } },
    })
    return NextResponse.json({ data: record })
  } catch (error) {
    console.error('Performance PUT error:', error)
    return NextResponse.json({ error: 'Failed to update performance review' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.performanceReview.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Performance DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete performance review' }, { status: 500 })
  }
}
