import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || ''
    const status = req.nextUrl.searchParams.get('status') || ''

    // Build WHERE conditions
    const conditions: string[] = []
    const params: any[] = []
    let idx = 1

    if (search) {
      conditions.push(`("companyName" ILIKE $${idx} OR "contactPerson" ILIKE $${idx} OR email ILIKE $${idx} OR country ILIKE $${idx})`)
      params.push(`%${search}%`)
      idx++
    }
    if (status) {
      conditions.push(`cl.status = $${idx++}`)
      params.push(status)
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 2 parallel HTTP queries — filtered clients with relations + all clients for stats
    const [clients, allClients] = await Promise.all([
      sql.query(
        `SELECT cl.*,
                row_to_json(sub.*) as subscription,
                row_to_json(lic.*) as license,
                COALESCE(
                  (SELECT json_agg(act ORDER BY act."createdAt" DESC) 
                   FROM "ClientActivity" act WHERE act."clientId" = cl.id LIMIT 5),
                  '[]'::json
                ) as activities
         FROM "Client" cl
         LEFT JOIN "Subscription" sub ON sub."clientId" = cl.id
         LEFT JOIN "License" lic ON lic."clientId" = cl.id
         ${whereClause}
         ORDER BY cl."createdAt" DESC`,
        params
      ),
      sql`SELECT id, status, "createdAt" FROM "Client"`,
    ])

    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const total = (clients as any[]).length

    const stats = {
      total: (allClients as any[]).length,
      active: (allClients as any[]).filter(c => c.status === 'active').length,
      suspended: (allClients as any[]).filter(c => c.status === 'suspended').length,
      newThisMonth: (allClients as any[]).filter(c => new Date(c.createdAt) >= thisMonth).length,
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

    // Batch 1: 3 parallel — delete dependent records and find related subscription
    const [, , sub] = await Promise.all([
      db.clientActivity.deleteMany({ where: { clientId: id } }),
      db.purchaseHistory.deleteMany({ where: { clientId: id } }),
      db.subscription.findFirst({ where: { clientId: id } }),
    ])

    // Find related license
    const lic = await db.license.findFirst({ where: { clientId: id } })

    // Batch 2: 2 parallel — delete subscription and license if found
    await Promise.all([
      sub ? db.subscription.delete({ where: { id: sub.id } }) : Promise.resolve(),
      lic ? db.license.delete({ where: { id: lic.id } }) : Promise.resolve(),
    ])

    // Finally delete the client
    await db.client.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Clients DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
