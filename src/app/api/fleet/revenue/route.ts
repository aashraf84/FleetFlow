import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || ''
    const category = req.nextUrl.searchParams.get('category') || ''
    const from = req.nextUrl.searchParams.get('from') || ''
    const to = req.nextUrl.searchParams.get('to') || ''

    const where: any = {}
    if (search) where.OR = [
      { description: { contains: search } },
      { category: { contains: search } },
    ]
    if (category) where.category = category
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
    }

    const [revenue, total] = await Promise.all([
      db.revenue.findMany({
        where,
        include: { client: true },
        orderBy: { date: 'desc' },
      }),
      db.revenue.count({ where }),
    ])

    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisYear = new Date(now.getFullYear(), 0, 1)
    const allRevenue = await db.revenue.findMany()

    const monthlyRevenue = allRevenue.filter(r => new Date(r.date) >= thisMonth).reduce((s, r) => s + r.amount, 0)
    const annualRevenue = allRevenue.filter(r => new Date(r.date) >= thisYear).reduce((s, r) => s + r.amount, 0)
    const pendingPayments = await db.expense.aggregate({ _sum: { amount: true }, where: { status: 'pending' } })

    // Revenue by month for chart
    const revenueByMonth: Record<string, number> = {}
    allRevenue.forEach(r => {
      const d = new Date(r.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      revenueByMonth[key] = (revenueByMonth[key] || 0) + r.amount
    })
    const revenueTrend = Object.entries(revenueByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, amount]) => ({ month, amount: Math.round(amount) }))

    // Revenue by category for pie
    const revenueByCategory: Record<string, number> = {}
    allRevenue.forEach(r => {
      revenueByCategory[r.category] = (revenueByCategory[r.category] || 0) + r.amount
    })
    const categoryChart = Object.entries(revenueByCategory).map(([name, value]) => ({ name, value: Math.round(value) }))

    const stats = {
      totalRevenue: allRevenue.reduce((s, r) => s + r.amount, 0),
      monthlyRevenue: Math.round(monthlyRevenue),
      annualRevenue: Math.round(annualRevenue),
      pendingPayments: pendingPayments._sum.amount || 0,
      totalRecords: allRevenue.length,
    }

    return NextResponse.json({ data: revenue, stats, total, revenueTrend, categoryChart })
  } catch (error) {
    console.error('Revenue GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch revenue' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const record = await db.revenue.create({ data: body })
    return NextResponse.json({ data: record })
  } catch (error) {
    console.error('Revenue POST error:', error)
    return NextResponse.json({ error: 'Failed to create revenue record' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const record = await db.revenue.update({ where: { id }, data })
    return NextResponse.json({ data: record })
  } catch (error) {
    console.error('Revenue PUT error:', error)
    return NextResponse.json({ error: 'Failed to update revenue record' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.revenue.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Revenue DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete revenue record' }, { status: 500 })
  }
}
