import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { deviceFingerprint } = await req.json()

    // Find or create demo user
    let demoUser = await db.user.findUnique({
      where: { email: 'demo@fleetflow.os' },
      include: { tenant: true }
    })

    if (!demoUser) {
      // Auto-seed demo user
      const demoTenant = await db.tenant.findFirst({ where: { slug: 'demo' } }) 
        || await db.tenant.create({
          data: {
            name: 'FleetFlow Demo Corp',
            slug: 'demo',
            dbName: 'ff_demo',
            dbReady: true,
            domain: 'demo.fleetflow.os',
            status: 'active',
            storageLimit: 5120,
            userLimit: 50,
            modulesEnabled: 'fleet,rental,customer,driver,fuel,maintenance,workshop,parts,finance,insurance,hr,documents,reports,ai',
          }
        })

      demoUser = await db.user.create({
        data: {
          email: 'demo@fleetflow.os',
          name: 'Demo User',
          password: 'demo_fleetflow_2024',
          role: 'demo',
          status: 'active',
          tenantId: demoTenant.id,
        },
        include: { tenant: true }
      })
    }

    if (demoUser.status !== 'active') {
      return NextResponse.json({ error: 'Demo account is currently unavailable' }, { status: 403 })
    }

    // Check device activation
    let deviceActivated = true
    if (deviceFingerprint) {
      const existingDevice = await db.device.findFirst({
        where: {
          OR: [
            { id: deviceFingerprint },
            { deviceName: deviceFingerprint }
          ]
        }
      })
      if (!existingDevice) {
        deviceActivated = false
      }
    }

    // Create session
    const sessionToken = generateToken()
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours for demo

    await db.session.create({
      data: {
        userId: demoUser.id,
        token: sessionToken,
        deviceInfo: deviceFingerprint || 'demo-device',
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        expiresAt,
      }
    })

    await db.user.update({
      where: { id: demoUser.id },
      data: { lastLogin: new Date(), lastLoginIp: req.headers.get('x-forwarded-for') || 'unknown' }
    })

    await db.auditLog.create({
      data: {
        userId: demoUser.id,
        action: 'DEMO_LOGIN',
        entity: 'User',
        entityId: demoUser.id,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        details: 'Demo user logged in',
      }
    })

    return NextResponse.json({
      user: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: 'demo',
        avatar: demoUser.avatar,
        tenant: demoUser.tenant ? { id: demoUser.tenant.id, name: demoUser.tenant.name } : null,
      },
      sessionToken,
      permissions: ['view_all'],
      deviceActivated,
      isDemo: true,
    })
  } catch (error) {
    console.error('Demo login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
