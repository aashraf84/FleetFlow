import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Create demo tenant
    const demoTenant = await db.tenant.upsert({
      where: { id: 'demo-tenant-001' },
      update: {},
      create: {
        id: 'demo-tenant-001',
        name: 'FleetFlow Demo Corp',
        domain: 'demo.fleetflow.os',
        status: 'active',
        storageLimit: 5120,
        userLimit: 50,
        modulesEnabled: 'fleet,rental,customer,driver,fuel,maintenance,workshop,parts,finance,insurance,hr,documents,reports,ai',
      }
    })

    // Create demo client (for license association)
    const demoClient = await db.client.upsert({
      where: { id: 'demo-client-001' },
      update: {},
      create: {
        id: 'demo-client-001',
        companyName: 'FleetFlow Demo Corp',
        contactPerson: 'Demo User',
        email: 'demo@fleetflow.os',
        phone: '+1-555-0100',
        country: 'United States',
        industryType: 'Fleet Management',
        subscriptionPlan: 'enterprise',
        licenseStatus: 'active',
        status: 'active',
        tenantId: demoTenant.id,
      }
    })

    // Create demo user
    await db.user.upsert({
      where: { email: 'demo@fleetflow.os' },
      update: {},
      create: {
        email: 'demo@fleetflow.os',
        name: 'Demo User',
        password: 'demo_fleetflow_2024',
        role: 'demo',
        status: 'active',
        tenantId: demoTenant.id,
      }
    })

    // Create admin user
    await db.user.upsert({
      where: { email: 'admin@fleetflow.os' },
      update: {},
      create: {
        email: 'admin@fleetflow.os',
        name: 'System Administrator',
        password: 'admin_fleetflow_2024',
        role: 'super_owner',
        status: 'active',
        tenantId: demoTenant.id,
      }
    })

    // Create demo license
    await db.license.upsert({
      where: { licenseKey: 'FFOS-DEMO-2024-ACTIVE' },
      update: {},
      create: {
        licenseKey: 'FFOS-DEMO-2024-ACTIVE',
        clientId: demoClient.id,
        status: 'active',
        maxDevices: 100,
        activationDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }
    })

    // Create enterprise license
    await db.license.upsert({
      where: { licenseKey: 'FFOS-ENT-2024-UNLTD' },
      update: {},
      create: {
        licenseKey: 'FFOS-ENT-2024-UNLTD',
        clientId: demoClient.id,
        status: 'active',
        maxDevices: 999,
        activationDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }
    })

    return NextResponse.json({ success: true, message: 'Seed data created' })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed data', details: String(error) }, { status: 500 })
  }
}
