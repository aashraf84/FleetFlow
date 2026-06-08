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
    const userEmail = req.nextUrl.searchParams.get('email')
    const userRole = req.nextUrl.searchParams.get('role')

    let client: any = null
    let subscription: any = null
    let license: any = null
    let tenant: any = null

    // For super_owner: Get the owner's tenant + associated client data
    if (userRole === 'super_owner' && userEmail) {
      // Get the user's tenant
      const users = await sql`
        SELECT u.id, u.email, u.name, u.role, u."tenantId",
               t.id as "tenant.id", t.name as "tenant.name", t.slug as "tenant.slug",
               t."activeUsers", t."userLimit", t."storageUsed", t."storageLimit", t."modulesEnabled"
        FROM "User" u
        LEFT JOIN "Tenant" t ON u."tenantId" = t.id
        WHERE u.email = ${userEmail}
        LIMIT 1
      `

      if (users && users.length > 0) {
        const user = users[0]
        tenant = user['tenant.id'] ? {
          id: user['tenant.id'],
          name: user['tenant.name'],
          slug: user['tenant.slug'],
          activeUsers: user['activeUsers'] || 0,
          userLimit: user['userLimit'] || 50,
          storageUsed: user['storageUsed'] || 0,
          storageLimit: user['storageLimit'] || 5120,
          modulesEnabled: user['modulesEnabled'] || '',
        } : null

        // Get the client associated with this tenant
        if (user['tenant.id']) {
          const clients = await sql`
            SELECT c.id, c."companyName", c.slug, c."contactPerson", c.email, c.phone,
                   c."subscriptionPlan", c."licenseStatus", c.status, c."createdAt"
            FROM "Client" c
            WHERE c."tenantId" = ${user['tenant.id']}
            LIMIT 1
          `
          if (clients && clients.length > 0) {
            client = clients[0]
          }
        }

        // If no client found for the tenant, create a virtual client from user info
        if (!client) {
          client = {
            id: user.id,
            companyName: user['tenant.name'] || 'ApexFlow Cloud',
            slug: user['tenant.slug'] || 'apexflow',
            contactPerson: user.name || 'System Administrator',
            email: user.email,
            phone: '',
            subscriptionPlan: 'enterprise',
            licenseStatus: 'active',
            status: 'active',
            createdAt: new Date().toISOString(),
          }
        }

        // Get subscription for this client
        if (client.id) {
          const subs = await sql`
            SELECT * FROM "Subscription" WHERE "clientId" = ${client.id} LIMIT 1
          `
          if (subs && subs.length > 0) {
            subscription = subs[0]
          }

          // Get license for this client
          const licenses = await sql`
            SELECT * FROM "License" WHERE "clientId" = ${client.id} LIMIT 1
          `
          if (licenses && licenses.length > 0) {
            license = licenses[0]
          }
        }

        // If no subscription, auto-create one for the owner
        if (!subscription) {
          const plan = 'enterprise'
          const pricing = planPricing[plan]
          const now = new Date()
          const expiry = new Date(now)
          expiry.setFullYear(expiry.getFullYear() + 1)

          try {
            const created = await db.subscription.create({
              data: {
                clientId: client.id,
                planType: plan,
                startDate: now,
                expiryDate: expiry,
                autoRenewal: true,
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

        // If no license, auto-create one for the owner
        if (!license) {
          try {
            const now = new Date()
            const expiry = new Date(now)
            expiry.setFullYear(expiry.getFullYear() + 1)
            const created = await db.license.create({
              data: {
                licenseKey: 'FFOS-OWNER-2024-MASTER',
                clientId: client.id,
                status: 'active',
                maxDevices: 100,
                activationDate: now,
                expiryDate: expiry,
              }
            })
            license = created
          } catch (e) {
            console.error('Auto-create license failed:', (e as Error).message)
          }
        }
      }
    } else {
      // For other users: Get client data based on their tenant
      if (userEmail) {
        const users = await sql`
          SELECT u.id, u.email, u.name, u."tenantId",
                 t.id as "tenant.id", t.name as "tenant.name", t.slug as "tenant.slug",
                 t."activeUsers", t."userLimit", t."storageUsed", t."storageLimit", t."modulesEnabled"
          FROM "User" u
          LEFT JOIN "Tenant" t ON u."tenantId" = t.id
          WHERE u.email = ${userEmail}
          LIMIT 1
        `

        if (users && users.length > 0) {
          const user = users[0]
          tenant = user['tenant.id'] ? {
            id: user['tenant.id'],
            name: user['tenant.name'],
            slug: user['tenant.slug'],
            activeUsers: user['activeUsers'] || 0,
            userLimit: user['userLimit'] || 50,
            storageUsed: user['storageUsed'] || 0,
            storageLimit: user['storageLimit'] || 5120,
            modulesEnabled: user['modulesEnabled'] || '',
          } : null

          if (user['tenant.id']) {
            const clients = await sql`
              SELECT c.id, c."companyName", c.slug, c."contactPerson", c.email, c.phone,
                     c."subscriptionPlan", c."licenseStatus", c.status, c."createdAt"
              FROM "Client" c
              WHERE c."tenantId" = ${user['tenant.id']}
              LIMIT 1
            `
            if (clients && clients.length > 0) {
              client = clients[0]
            }
          }

          if (client?.id) {
            const subs = await sql`
              SELECT * FROM "Subscription" WHERE "clientId" = ${client.id} LIMIT 1
            `
            if (subs && subs.length > 0) subscription = subs[0]

            const licenses = await sql`
              SELECT * FROM "License" WHERE "clientId" = ${client.id} LIMIT 1
            `
            if (licenses && licenses.length > 0) license = licenses[0]
          }
        }
      }

      // Fallback: Get the most recently created active client with its subscription
      if (!client) {
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

        if (clients && clients.length > 0) {
          client = clients[0]
          subscription = client.subscription
          license = client.license
        }
      }
    }

    if (!client) {
      return NextResponse.json({ data: null })
    }

    // If no subscription exists but client has a subscriptionPlan, auto-create one
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

    // Get tenant info if not already set
    if (!tenant) {
      const tenants = await sql`
        SELECT id, name, slug, "activeUsers", "userLimit", "storageUsed", "storageLimit", "modulesEnabled"
        FROM "Tenant"
        LIMIT 1
      `
      tenant = tenants && tenants.length > 0 ? tenants[0] : null
    }

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
        license: license || null,
        tenant: tenant || null,
        stats: stats && stats.length > 0 ? stats[0] : { total: 0, active: 0, suspended: 0, expired: 0, revenue: 0 },
      }
    })
  } catch (error) {
    console.error('Client info GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch client info' }, { status: 500 })
  }
}
