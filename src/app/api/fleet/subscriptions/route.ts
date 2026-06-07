import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || ''
    const status = req.nextUrl.searchParams.get('status') || ''

    const conditions: string[] = []
    const params: any[] = []
    let idx = 1

    if (search) {
      conditions.push(`s."planType" ILIKE $${idx++}`)
      params.push(`%${search}%`)
    }
    if (status) {
      conditions.push(`s.status = $${idx++}`)
      params.push(status)
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const now = new Date()
    const thirtyDays = new Date(now.getTime() + 30 * 86400000)

    // 2 parallel HTTP queries — filtered subscriptions + all for stats
    const [subscriptions, allSubscriptions] = await Promise.all([
      sql.query(
        `SELECT s.*, row_to_json(cl.*) as client
         FROM "Subscription" s
         LEFT JOIN "Client" cl ON s."clientId" = cl.id
         ${whereClause}
         ORDER BY s."createdAt" DESC`,
        params
      ),
      sql`SELECT status, "expiryDate", price FROM "Subscription"`,
    ])

    const total = (subscriptions as any[]).length

    const stats = {
      total: (allSubscriptions as any[]).length,
      active: (allSubscriptions as any[]).filter(s => s.status === 'active').length,
      expiringSoon: (allSubscriptions as any[]).filter(s =>
        s.status === 'active' && s.expiryDate && new Date(s.expiryDate) <= thirtyDays && new Date(s.expiryDate) >= now
      ).length,
      revenue: (allSubscriptions as any[]).reduce((sum, s) => sum + (s.price || 0), 0),
    }

    return NextResponse.json({ data: subscriptions, stats, total })
  } catch (error) {
    console.error('Subscriptions GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const subscription = await db.subscription.create({ data: body })
    return NextResponse.json({ data: subscription })
  } catch (error) {
    console.error('Subscriptions POST error:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const subscription = await db.subscription.update({ where: { id }, data })
    return NextResponse.json({ data: subscription })
  } catch (error) {
    console.error('Subscriptions PUT error:', error)
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.subscription.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscriptions DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 })
  }
}
