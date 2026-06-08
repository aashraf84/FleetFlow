import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || ''
    const category = req.nextUrl.searchParams.get('category') || ''
    const from = req.nextUrl.searchParams.get('from') || ''
    const to = req.nextUrl.searchParams.get('to') || ''

    // Build WHERE conditions for filtered revenue query
    const conditions: string[] = []
    const params: any[] = []
    let idx = 1

    if (search) {
      conditions.push(`(r.description ILIKE $${idx} OR r.category ILIKE $${idx})`)
      params.push(`%${search}%`)
      idx++
    }
    if (category) {
      conditions.push(`r.category = $${idx++}`)
      params.push(category)
    }
    if (from) {
      conditions.push(`r.date >= $${idx++}`)
      params.push(from)
    }
    if (to) {
      conditions.push(`r.date <= $${idx++}`)
      params.push(to)
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 3 parallel HTTP queries — no connection pool limits
    const [revenue, allRevenue, pendingResult, subscriptionStats, clientStats] = await Promise.all([
      sql.query(
        `SELECT r.*, row_to_json(cl.*) as client
         FROM "Revenue" r
         LEFT JOIN "Client" cl ON r."clientId" = cl.id
         ${whereClause}
         ORDER BY r.date DESC`,
        params
      ),
      sql`SELECT amount, date, category FROM "Revenue"`,
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM "Expense" WHERE status = 'pending'`,
      sql`SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE "autoRenewal" = true)::int as auto_renewal FROM "Subscription" WHERE status = 'active'`,
      sql`SELECT COUNT(*)::int as total, COUNT(*) FILTER (WHERE status = 'active')::int as active, COUNT(*) FILTER (WHERE "createdAt" >= NOW() - interval '30 days')::int as new_this_month FROM "Client"`,
    ])

    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisYear = new Date(now.getFullYear(), 0, 1)

    const monthlyRevenue = (allRevenue as any[]).filter(r => new Date(r.date) >= thisMonth).reduce((s, r) => s + r.amount, 0)
    const annualRevenue = (allRevenue as any[]).filter(r => new Date(r.date) >= thisYear).reduce((s, r) => s + r.amount, 0)

    // Revenue by month for chart
    const revenueByMonth: Record<string, number> = {}
    ;(allRevenue as any[]).forEach(r => {
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
    ;(allRevenue as any[]).forEach(r => {
      revenueByCategory[r.category] = (revenueByCategory[r.category] || 0) + r.amount
    })
    const categoryChart = Object.entries(revenueByCategory).map(([name, value]) => ({ name, value: Math.round(value) }))

    const total = (revenue as any[]).length
    const stats = {
      totalRevenue: (allRevenue as any[]).reduce((s, r) => s + r.amount, 0),
      monthlyRevenue: Math.round(monthlyRevenue),
      annualRevenue: Math.round(annualRevenue),
      pendingPayments: (pendingResult as any[])[0]?.total || 0,
      totalRecords: (allRevenue as any[]).length,
    }

    // Compute subscription growth metrics from real data
    const subs = (subscriptionStats as any[])[0] || { total: 0, auto_renewal: 0 }
    const cliStats = (clientStats as any[])[0] || { total: 0, active: 0, new_this_month: 0 }
    const activeClientCount = cliStats.active || 0
    const newSubsThisMonth = cliStats.new_this_month || 0
    const renewalRate = subs.total > 0 ? Math.round((subs.auto_renewal / subs.total) * 100) : 0
    const avgRevPerClient = activeClientCount > 0 ? Math.round(stats.annualRevenue / activeClientCount) : 0

    // Compute churn and retention from subscription data
    const totalSubscriptions = subs.total || 0
    const churnRate = totalSubscriptions > 0 ? Math.round((1 - renewalRate / 100) * 1000) / 10 : 0
    const retentionRate = Math.round((100 - churnRate) * 10) / 10

    // Compute month-over-month trends from revenue data
    const sortedMonths = Object.entries(revenueByMonth).sort(([a], [b]) => a.localeCompare(b))
    const lastMonth = sortedMonths.length >= 2 ? sortedMonths[sortedMonths.length - 1][1] : 0
    const prevMonth = sortedMonths.length >= 2 ? sortedMonths[sortedMonths.length - 2][1] : 0
    const revenueGrowthPct = prevMonth > 0 ? Math.round(((lastMonth - prevMonth) / prevMonth) * 1000) / 10 : 0

    const subscriptionMetrics = {
      newSubsGrowthPct: newSubsThisMonth > 0 && cliStats.total > 0 ? Math.round((newSubsThisMonth / cliStats.total) * 100) : 0,
      renewalRate,
      avgRevPerClient,
      churnRate,
      retentionRate,
      revenueGrowthPct,
    }

    return NextResponse.json({ data: revenue, stats, total, revenueTrend, categoryChart, subscriptionMetrics })
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
