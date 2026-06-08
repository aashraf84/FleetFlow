import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

// Plan pricing map
const planPricing: Record<string, { price: number; userLimit: number; storageLimit: number }> = {
  trial: { price: 0, userLimit: 5, storageLimit: 500 },
  monthly: { price: 299, userLimit: 25, storageLimit: 2048 },
  annual: { price: 2990, userLimit: 50, storageLimit: 5120 },
  enterprise: { price: 9999, userLimit: 100, storageLimit: 10240 },
  custom: { price: 4999, userLimit: 75, storageLimit: 8192 },
}

export async function GET(req: NextRequest) {
  try {
    // Get the most recently created active client with its subscription
    const clients = await sql`
      SELECT 
        c.id, c."companyName", c.slug, c."contactPerson", c.email, c.phone,
        c."subscriptionPlan", c."licenseStatus", c.status, c."createdAt",
        row_to_json(s.*) as subscription,
        row_to_json(l.*) as license
      FROM "Client" c
      LEFT JOIN "Subscription" s ON s."clientId" = c.id
      LEFT JOIN "License" l ON l."clientId" = c.id
      ORDER BY c."createdAt" DESC
      LIMIT 1
    `

    if (!clients || clients.length === 0) {
      return NextResponse.json({ data: null })
    }

    const client = clients[0]

    // If no subscription exists but client has a subscriptionPlan, auto-create one
    let subscription = client.subscription
    if (!subscription && client.subscriptionPlan) {
      const plan = client.subscriptionPlan as string
      const pricing = planPricing[plan] || planPricing.monthly
      const now = new Date()
      const expiry = new Date(now)
      if (plan === 'trial') expiry.setDate(expiry.getDate() + 14)
      else if (plan === 'monthly') expiry.setMonth(expiry.getMonth() + 1)
      else expiry.setFullYear(expiry.getFullYear() + 1)

      try {
        const created = await db.subscription.create({
          data: {
            clientId: client.id,
            planType: plan,
            startDate: now,
            expiryDate: expiry,
            autoRenewal: plan !== 'trial',
            price: pricing.price,
            currency: 'USD',
            status: 'active',
            userLimit: pricing.userLimit,
            storageLimit: pricing.storageLimit,
            activeModules: 'fleet,rental,customer,driver,fuel,maintenance,workshop,parts,finance,insurance,hr,documents,reports,ai',
          }
        })
        subscription = created
      } catch (e) {
        console.error('Auto-create subscription failed:', (e as Error).message)
      }
    }

    // Get subscription stats across all clients
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended,
        COUNT(*) FILTER (WHERE status = 'expired') as expired,
        COALESCE(SUM(price) FILTER (WHERE status = 'active'), 0) as revenue
      FROM "Subscription"
    `

    // Get tenant info
    const tenants = await sql`
      SELECT id, name, slug, "activeUsers", "userLimit", "storageUsed", "storageLimit", "modulesEnabled"
      FROM "Tenant"
      LIMIT 1
    `

    return NextResponse.json({
      data: {
        client: {
          id: client.id,
          companyName: client.companyName,
          slug: client.slug,
          contactPerson: client.contactPerson,
          email: client.email,
          phone: client.phone,
          subscriptionPlan: client.subscriptionPlan,
          licenseStatus: client.licenseStatus,
          status: client.status,
          createdAt: client.createdAt,
        },
        subscription: subscription || null,
        license: client.license || null,
        tenant: tenants && tenants.length > 0 ? tenants[0] : null,
        stats: stats && stats.length > 0 ? stats[0] : { total: 0, active: 0, suspended: 0, expired: 0, revenue: 0 },
      }
    })
  } catch (error) {
    console.error('Client info GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch client info' }, { status: 500 })
  }
}
