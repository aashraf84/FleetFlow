import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || ''
    const status = req.nextUrl.searchParams.get('status') || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { contactPerson: { contains: search } },
        { email: { contains: search } },
        { country: { contains: search } },
      ]
    }
    if (status) where.status = status

    const [clients, total] = await Promise.all([
      db.client.findMany({
        where,
        include: {
          subscription: true,
          license: true,
          activities: { take: 5, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.client.count({ where }),
    ])

    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const stats = {
      total: await db.client.count(),
      active: await db.client.count({ where: { status: 'active' } }),
      suspended: await db.client.count({ where: { status: 'suspended' } }),
      newThisMonth: await db.client.count({ where: { createdAt: { gte: thisMonth } } }),
    }

    return NextResponse.json({ data: clients, stats, total })
  } catch (error) {
    console.error('Clients GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const client = await db.client.create({ data: body })

    // Create subscription if plan specified
    if (body.subscriptionPlan) {
      const planMap: Record<string, { price: number; months: number }> = {
        trial: { price: 0, months: 1 },
        monthly: { price: 299, months: 1 },
        annual: { price: 2999, months: 12 },
        enterprise: { price: 9999, months: 12 },
      }
      const plan = planMap[body.subscriptionPlan] || planMap.trial
      const now = new Date()
      await db.subscription.create({
        data: {
          clientId: client.id,
          planType: body.subscriptionPlan,
          startDate: now,
          expiryDate: new Date(now.getTime() + plan.months * 30 * 86400000),
          autoRenewal: body.subscriptionPlan !== 'trial',
          price: plan.price,
          status: 'active',
        }
      })
    }

    // Create license
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const seg = () => Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
    await db.license.create({
      data: {
        clientId: client.id,
        licenseKey: `FF-${seg()}-${seg()}-${seg()}`,
        status: body.subscriptionPlan === 'trial' ? 'trial' : 'active',
        activationDate: body.subscriptionPlan !== 'trial' ? new Date() : null,
        expiryDate: body.subscriptionPlan !== 'trial' ? new Date(Date.now() + 365 * 86400000) : null,
      }
    })

    return NextResponse.json({ data: client })
  } catch (error) {
    console.error('Clients POST error:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const client = await db.client.update({ where: { id }, data })
    return NextResponse.json({ data: client })
  } catch (error) {
    console.error('Clients PUT error:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await db.clientActivity.deleteMany({ where: { clientId: id } })
    await db.purchaseHistory.deleteMany({ where: { clientId: id } })
    const sub = await db.subscription.findFirst({ where: { clientId: id } })
    if (sub) await db.subscription.delete({ where: { id: sub.id } })
    const lic = await db.license.findFirst({ where: { clientId: id } })
    if (lic) await db.license.delete({ where: { id: lic.id } })
    await db.client.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Clients DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
