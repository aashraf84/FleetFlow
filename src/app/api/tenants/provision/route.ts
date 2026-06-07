import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { provisionTenantDatabase } from '@/lib/tenant-db'

// POST /api/tenants/provision — Create a new tenant with their own database
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyName, slug, contactPerson, email, phone, country, industryType, subscriptionPlan } = body

    if (!companyName || !slug || !contactPerson || !email) {
      return NextResponse.json(
        { error: 'Company name, slug, contact person, and email are required' },
        { status: 400 }
      )
    }

    // Validate slug format (lowercase, alphanumeric, hyphens)
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    if (!cleanSlug || cleanSlug.length < 3) {
      return NextResponse.json(
        { error: 'Slug must be at least 3 characters, lowercase alphanumeric with hyphens' },
        { status: 400 }
      )
    }

    // Check if slug is already taken
    const existing = await db.tenant.findFirst({
      where: { OR: [{ slug: cleanSlug }, { dbName: `ff_${cleanSlug}` }] }
    })
    if (existing) {
      return NextResponse.json(
        { error: 'This slug is already taken. Please choose another.' },
        { status: 409 }
      )
    }

    // Step 1: Create the tenant record (initially dbReady = false)
    const tenant = await db.tenant.create({
      data: {
        name: companyName,
        slug: cleanSlug,
        dbName: `ff_${cleanSlug}`,
        dbReady: false,
        domain: null,
        status: 'active',
        modulesEnabled: 'fleet,rental,customer,driver,fuel,maintenance',
        userLimit: subscriptionPlan === 'enterprise' ? 50 : subscriptionPlan === 'annual' ? 20 : 10,
        storageLimit: subscriptionPlan === 'enterprise' ? 10240 : subscriptionPlan === 'annual' ? 5120 : 1024,
      }
    })

    // Step 2: Create client record
    const client = await db.client.create({
      data: {
        companyName,
        slug: cleanSlug,
        contactPerson,
        email,
        phone: phone || null,
        country: country || null,
        industryType: industryType || null,
        subscriptionPlan: subscriptionPlan || 'trial',
        licenseStatus: 'active',
        status: 'active',
        tenantId: tenant.id,
      }
    })

    // Step 3: Create subscription
    const now = new Date()
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // 14-day trial
    await db.subscription.create({
      data: {
        clientId: client.id,
        planType: subscriptionPlan || 'trial',
        startDate: now,
        expiryDate: trialEnd,
        renewalDate: subscriptionPlan !== 'trial' ? trialEnd : null,
        autoRenewal: subscriptionPlan !== 'trial',
        activeModules: 'fleet,rental,customer,driver,fuel,maintenance',
        userLimit: tenant.userLimit,
        storageLimit: tenant.storageLimit,
        price: subscriptionPlan === 'enterprise' ? 299 : subscriptionPlan === 'annual' ? 149 : subscriptionPlan === 'monthly' ? 49 : 0,
        currency: 'USD',
        status: 'active',
      }
    })

    // Step 4: Generate license key
    const licenseKey = `FFOS-${cleanSlug.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${now.getFullYear()}`
    await db.license.create({
      data: {
        clientId: client.id,
        licenseKey,
        status: 'trial',
        maxDevices: subscriptionPlan === 'enterprise' ? 10 : 3,
      }
    })

    // Step 5: Provision the tenant database (async - may take a few seconds)
    const provisionResult = await provisionTenantDatabase(cleanSlug)

    // Step 6: Update tenant with dbReady status
    await db.tenant.update({
      where: { id: tenant.id },
      data: { dbReady: provisionResult.success }
    })

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        dbName: tenant.dbName,
        dbReady: provisionResult.success,
      },
      client: {
        id: client.id,
        companyName: client.companyName,
      },
      licenseKey,
      provisioning: provisionResult.success 
        ? 'Database provisioned successfully' 
        : `Database provisioning pending: ${provisionResult.error}`,
    }, { status: 201 })

  } catch (error: any) {
    console.error('Tenant provisioning error:', error)
    return NextResponse.json(
      { error: 'Failed to provision tenant', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/tenants/provision — List all tenants and their DB status
export async function GET(req: NextRequest) {
  try {
    const tenants = await db.tenant.findMany({
      include: {
        clients: { select: { id: true, companyName: true, email: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      tenants: tenants.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        dbName: t.dbName,
        dbReady: t.dbReady,
        status: t.status,
        modulesEnabled: t.modulesEnabled,
        userLimit: t.userLimit,
        storageLimit: t.storageLimit,
        createdAt: t.createdAt,
        clients: t.clients,
      })),
      total: tenants.length,
      active: tenants.filter(t => t.status === 'active').length,
      provisioning: tenants.filter(t => !t.dbReady).length,
    })
  } catch (error: any) {
    console.error('List tenants error:', error)
    return NextResponse.json(
      { error: 'Failed to list tenants' },
      { status: 500 }
    )
  }
}
