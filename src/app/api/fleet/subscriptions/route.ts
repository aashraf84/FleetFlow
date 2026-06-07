import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || ''
    const status = req.nextUrl.searchParams.get('status') || ''

    const where: any = {}
    if (search) where.OR = [{ planType: { contains: search } }]
    if (status) where.status = status

    const [subscriptions, total] = await Promise.all([
      db.subscription.findMany({
        where,
        include: { client: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.subscription.count({ where }),
    ])

    const now = new Date()
    const thirtyDays = new Date(now.getTime() + 30 * 86400000)
    const totalRevenue = await db.subscription.aggregate({ _sum: { price: true } })

    const stats = {
      total: await db.subscription.count(),
      active: await db.subscription.count({ where: { status: 'active' } }),
      expiringSoon: await db.subscription.count({ where: { expiryDate: { lte: thirtyDays, gte: now }, status: 'active' } }),
      revenue: totalRevenue._sum.price || 0,
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
