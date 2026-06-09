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

    const stats = {
      total: (allClients as any[]).length,
      active: (allClients as any[]).filter(c => c.status === 'active').length,
      suspended: (allClients as any[]).filter(c => c.status === 'suspended').length,
      newThisMonth: (allClients as any[]).filter(c => new Date(c.createdAt) >= thisMonth).length,
    }

    return NextResponse.json({ data: clients, stats })
  } catch (error) {
    console.error('Clients GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

const CLIENT_FIELDS = [
  'companyName', 'slug', 'contactPerson', 'email', 'phone', 'country',
  'industryType', 'subscriptionPlan', 'licenseStatus', 'notes', 'status',
  'tenantId',
] as const

function pickClientFields(body: Record<string, any>) {
  const data: Record<string, any> = {}
  for (const key of CLIENT_FIELDS) {
    if (body[key] !== undefined && body[key] !== '') {
      data[key] = body[key]
    }
  }
  return data
}

// Plan pricing configuration (must match frontend)
const PLAN_CONFIG: Record<string, { basePrice: number; months: number }> = {
  trial: { basePrice: 0, months: 1 },
  monthly: { basePrice: 99, months: 1 },
  annual: { basePrice: 999, months: 12 },
  enterprise: { basePrice: 2499, months: 12 },
}

const MODULE_PRICES: Record<string, number> = {
  fleet: 49, rental: 39, customer: 29, driver: 29, transport: 49,
  fuel: 19, maintenance: 39, finance: 49, insurance: 19, hr: 39,
  compliance: 19, documents: 9,
}

const PLAN_DISCOUNT: Record<string, number> = {
  trial: 0, monthly: 0, annual: 16, enterprise: 25,
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Auto-generate slug if not provided
    if (!body.slug) {
      body.slug = (body.companyName || 'client').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
    }
    // Map industry to industryType if needed
    if (body.industry && !body.industryType) {
      body.industryType = body.industry
    }

    const selectedModules: string[] = body.selectedModules || ['fleet', 'rental', 'customer', 'driver']
    const subscriptionPlan = body.subscriptionPlan || 'trial'
    const discount = body.discount || 0
    const discountType = body.discountType || 'percentage'
    const currency = body.currency || 'USD'
    const exchangeRate = body.exchangeRate || 1
    
    // ============================================
    // Step 1: Create Client Record
    // ============================================
    const clientData = pickClientFields(body)
    const client = await db.client.create({ data: clientData })

    // ============================================
    // Step 2: Create Subscription with modules & pricing
    // ============================================
    if (subscriptionPlan) {
      const plan = PLAN_CONFIG[subscriptionPlan] || PLAN_CONFIG.trial
      const planDiscountPct = PLAN_DISCOUNT[subscriptionPlan] || 0
      const moduleTotal = selectedModules.reduce((sum, m) => sum + (MODULE_PRICES[m] || 0), 0)
      const subtotal = plan.basePrice + moduleTotal
      const afterPlanDiscount = subtotal * (1 - planDiscountPct / 100)
      
      let customDiscount = 0
      if (discountType === 'percentage') {
        customDiscount = afterPlanDiscount * (discount / 100)
      } else {
        customDiscount = Math.min(discount, afterPlanDiscount)
      }
      const totalAmount = afterPlanDiscount - customDiscount

      const now = new Date()
      await db.subscription.create({
        data: {
          clientId: client.id,
          planType: subscriptionPlan,
          startDate: now,
          expiryDate: new Date(now.getTime() + plan.months * 30 * 86400000),
          autoRenewal: subscriptionPlan !== 'trial',
          price: totalAmount,
          activeModules: selectedModules.join(','),
          userLimit: subscriptionPlan === 'enterprise' ? 50 : subscriptionPlan === 'annual' ? 25 : subscriptionPlan === 'monthly' ? 10 : 5,
          storageLimit: subscriptionPlan === 'enterprise' ? 10240 : subscriptionPlan === 'annual' ? 5120 : subscriptionPlan === 'monthly' ? 2048 : 512,
          status: 'active',
          currency: currency,
        }
      })
    }

    // ============================================
    // Step 3: Create License
    // ============================================
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const seg = () => Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
    await db.license.create({
      data: {
        clientId: client.id,
        licenseKey: `FF-${seg()}-${seg()}-${seg()}`,
        status: subscriptionPlan === 'trial' ? 'trial' : 'active',
        activationDate: subscriptionPlan !== 'trial' ? new Date() : null,
        expiryDate: subscriptionPlan !== 'trial' ? new Date(Date.now() + 365 * 86400000) : null,
        maxDevices: subscriptionPlan === 'enterprise' ? 10 : subscriptionPlan === 'annual' ? 5 : 3,
      }
    })

    // ============================================
    // Step 4: Create Tenant Record
    // ============================================
    const slug = body.slug
    const dbName = `ff_${slug.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
    const shouldProvisionDB = body.autoProvisionDB !== false
    
    const tenant = await db.tenant.create({
      data: {
        name: body.companyName,
        slug: slug,
        domain: body.domain || null,
        dbName: dbName,
        dbReady: false, // Will be set to true after provisioning
        modulesEnabled: selectedModules.join(','),
        activeUsers: 0,
        userLimit: subscriptionPlan === 'enterprise' ? 50 : subscriptionPlan === 'annual' ? 25 : subscriptionPlan === 'monthly' ? 10 : 5,
        storageUsed: 0,
        storageLimit: subscriptionPlan === 'enterprise' ? 10240 : subscriptionPlan === 'annual' ? 5120 : subscriptionPlan === 'monthly' ? 2048 : 512,
        status: 'active',
      }
    })

    // Link tenant to client
    await db.client.update({
      where: { id: client.id },
      data: { tenantId: tenant.id },
    })

    // ============================================
    // Step 5: Create Admin User (if requested)
    // ============================================
    if (body.createAdminUser && body.adminEmail) {
      // Hash a simple password (in production, use bcrypt)
      const adminPassword = body.adminPassword || 'changeme123'
      
      await db.user.create({
        data: {
          email: body.adminEmail,
          name: body.adminName || body.contactPerson,
          password: adminPassword, // In production, this should be hashed
          role: 'client_owner',
          status: 'active',
          tenantId: tenant.id,
        }
      })
    }

    // ============================================
    // Step 6: Create initial activity record
    // ============================================
    await db.clientActivity.create({
      data: {
        clientId: client.id,
        action: 'client_registered',
        details: `Client registered with ${subscriptionPlan} plan, ${selectedModules.length} modules, ${shouldProvisionDB ? 'auto-provision DB enabled' : 'manual DB setup'}`,
      }
    })

    // ============================================
    // Step 7: Attempt tenant DB provisioning
    // ============================================
    let dbProvisionResult = { success: false, dbName, error: 'Provisioning deferred' }
    
    if (shouldProvisionDB) {
      try {
        // Try creating the database via Neon SQL API
        // Connect to the 'postgres' default database to CREATE DATABASE
        // Note: CREATE DATABASE doesn't support parameterized queries, so we use sql.unsafe
        const createDbUrl = 'postgresql://neondb_owner:npg_e4uQwH9cNifF@ep-lucky-fog-ap5pa8qr-pooler.c-7.us-east-1.aws.neon.tech/postgres?sslmode=require'
        const { neon } = await import('@neondatabase/serverless')
        const adminSql = neon(createDbUrl)
        
        // Use raw SQL string since CREATE DATABASE doesn't support $1 params
        // Sanitize dbName: only allow alphanumeric and underscores
        const safeDbName = dbName.replace(/[^a-z0-9_]/g, '')
        await adminSql.unsafe(`CREATE DATABASE "${safeDbName}"`)
        
        // Mark tenant as ready
        await db.tenant.update({
          where: { id: tenant.id },
          data: { dbReady: true },
        })
        
        // Run schema migration on the new database
        try {
          const tenantDbUrl = `postgresql://neondb_owner:npg_e4uQwH9cNifF@ep-lucky-fog-ap5pa8qr-pooler.c-7.us-east-1.aws.neon.tech/${dbName}?sslmode=require`
          const tenantSql = neon(tenantDbUrl)
          
          // Create the core tenant tables
          await tenantSql`
            CREATE TABLE IF NOT EXISTS "Vehicle" (
              id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
              "vehicleNumber" TEXT NOT NULL,
              "registrationNumber" TEXT NOT NULL,
              make TEXT NOT NULL,
              model TEXT NOT NULL,
              year INTEGER NOT NULL DEFAULT 0,
              category TEXT NOT NULL DEFAULT 'sedan',
              color TEXT,
              vin TEXT,
              "engineNumber" TEXT,
              transmission TEXT,
              "fuelType" TEXT NOT NULL DEFAULT 'petrol',
              mileage DOUBLE PRECISION NOT NULL DEFAULT 0,
              status TEXT NOT NULL DEFAULT 'available',
              "dailyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
              "weeklyRate" DOUBLE PRECISION,
              "monthlyRate" DOUBLE PRECISION,
              "currentLocation" TEXT,
              "lastServiceDate" TIMESTAMP,
              "nextServiceDate" TIMESTAMP,
              "insuranceExpiry" TIMESTAMP,
              "registrationExpiry" TIMESTAMP,
              notes TEXT,
              "tenantId" TEXT,
              "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
              "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
            )
          `
          
          await tenantSql`
            CREATE TABLE IF NOT EXISTS "Customer" (
              id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
              "firstName" TEXT NOT NULL,
              "lastName" TEXT NOT NULL,
              email TEXT NOT NULL UNIQUE,
              phone TEXT NOT NULL,
              address TEXT,
              city TEXT,
              country TEXT,
              nationality TEXT,
              "idNumber" TEXT,
              "drivingLicense" TEXT,
              "licenseExpiry" TIMESTAMP,
              "dateOfBirth" TIMESTAMP,
              "emergencyContact" TEXT,
              "emergencyPhone" TEXT,
              status TEXT NOT NULL DEFAULT 'active',
              notes TEXT,
              "totalRentals" INTEGER NOT NULL DEFAULT 0,
              "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
              "tenantId" TEXT,
              "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
              "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
            )
          `
          
          await tenantSql`
            CREATE TABLE IF NOT EXISTS "Driver" (
              id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
              "firstName" TEXT NOT NULL,
              "lastName" TEXT NOT NULL,
              email TEXT UNIQUE,
              phone TEXT NOT NULL,
              "licenseNumber" TEXT NOT NULL,
              "licenseExpiry" TIMESTAMP,
              "licenseClass" TEXT,
              address TEXT,
              city TEXT,
              nationality TEXT,
              "dateOfBirth" TIMESTAMP,
              "hireDate" TIMESTAMP,
              status TEXT NOT NULL DEFAULT 'active',
              rating DOUBLE PRECISION NOT NULL DEFAULT 0,
              "totalTrips" INTEGER NOT NULL DEFAULT 0,
              "totalDistance" DOUBLE PRECISION NOT NULL DEFAULT 0,
              "emergencyContact" TEXT,
              notes TEXT,
              "tenantId" TEXT,
              "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
              "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
            )
          `
          
          dbProvisionResult = { success: true, dbName, error: '' }
        } catch (migrationErr: any) {
          console.error('Tenant schema migration error:', migrationErr?.message)
          // DB was created but migration failed - still mark as provisioned
          dbProvisionResult = { success: true, dbName, error: `Schema migration partial: ${migrationErr?.message}` }
        }
      } catch (dbErr: any) {
        console.error('Tenant DB provisioning error:', dbErr?.message)
        dbProvisionResult = { success: false, dbName, error: dbErr?.message || 'Unknown error' }
        
        // Create activity about provisioning failure
        await db.clientActivity.create({
          data: {
            clientId: client.id,
            action: 'db_provisioning_failed',
            details: `Failed to provision database ${dbName}: ${dbErr?.message}`,
          }
        })
      }
    }

    return NextResponse.json({ 
      data: client, 
      tenant: { id: tenant.id, dbName, dbReady: tenant.dbReady },
      dbName,
      dbProvisioned: dbProvisionResult.success,
      dbError: dbProvisionResult.error || undefined,
    })
  } catch (error: any) {
    console.error('Clients POST error:', error)
    return NextResponse.json({ error: 'Failed to create client', details: error?.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    const data = pickClientFields(rest)
    const client = await db.client.update({ where: { id }, data })
    
    // Update subscription if modules or plan changed
    if (rest.subscriptionPlan || rest.selectedModules) {
      const existingSub = await db.subscription.findFirst({ where: { clientId: id } })
      if (existingSub) {
        const selectedModules: string[] = rest.selectedModules || (existingSub.activeModules ? existingSub.activeModules.split(',') : [])
        const subscriptionPlan = rest.subscriptionPlan || existingSub.planType
        const plan = PLAN_CONFIG[subscriptionPlan] || PLAN_CONFIG.trial
        const planDiscountPct = PLAN_DISCOUNT[subscriptionPlan] || 0
        const discount = rest.discount || 0
        const discountType = rest.discountType || 'percentage'
        const moduleTotal = selectedModules.reduce((sum: number, m: string) => sum + (MODULE_PRICES[m] || 0), 0)
        const subtotal = plan.basePrice + moduleTotal
        const afterPlanDiscount = subtotal * (1 - planDiscountPct / 100)
        let customDiscount = 0
        if (discountType === 'percentage') {
          customDiscount = afterPlanDiscount * (discount / 100)
        } else {
          customDiscount = Math.min(discount, afterPlanDiscount)
        }
        const totalAmount = afterPlanDiscount - customDiscount

        await db.subscription.update({
          where: { id: existingSub.id },
          data: {
            planType: subscriptionPlan,
            price: totalAmount,
            activeModules: selectedModules.join(','),
          }
        })
      }
    }

    // Update tenant modules if changed
    if (rest.selectedModules) {
      const clientWithTenant = await db.client.findUnique({ where: { id }, include: { tenant: true } })
      if (clientWithTenant?.tenant) {
        await db.tenant.update({
          where: { id: clientWithTenant.tenant.id },
          data: { modulesEnabled: rest.selectedModules.join(',') },
        })
      }
    }

    // Activity record
    await db.clientActivity.create({
      data: {
        clientId: id,
        action: 'client_updated',
        details: 'Client information updated',
      }
    })

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

    // Find the client to get tenant info
    const client = await db.client.findUnique({ where: { id }, include: { tenant: true } })

    // Batch 1: 3 parallel — delete dependent records and find related subscription
    const [, , sub] = await Promise.all([
      db.clientActivity.deleteMany({ where: { clientId: id } }),
      db.purchaseHistory.deleteMany({ where: { clientId: id } }),
      db.subscription.findFirst({ where: { clientId: id } }),
    ])

    // Find related license
    const lic = await db.license.findFirst({ where: { clientId: id } })

    // Find related revenues
    const revenues = await db.revenue.findMany({ where: { clientId: id } })

    // Batch 2: Delete subscription, license, and revenue records
    await Promise.all([
      sub ? db.subscription.delete({ where: { id: sub.id } }) : Promise.resolve(),
      lic ? db.license.delete({ where: { id: lic.id } }) : Promise.resolve(),
      revenues.length > 0 ? db.revenue.deleteMany({ where: { clientId: id } }) : Promise.resolve(),
    ])

    // Delete users linked to this client's tenant
    if (client?.tenantId) {
      await db.user.deleteMany({ where: { tenantId: client.tenantId } })
      // Delete tenant
      await db.tenant.delete({ where: { id: client.tenantId } })
    }

    // Finally delete the client
    await db.client.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Clients DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
