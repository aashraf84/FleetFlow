import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function POST(req: NextRequest) {
  let deviceFingerprint = 'demo-device'
  try {
    const body = await req.json()
    deviceFingerprint = body.deviceFingerprint || 'demo-device'
  } catch {}

  // Demo login — try DB first, fallback to static response
  try {
    const demoUser = await db.user.findUnique({
      where: { email: 'demo@fleetflow.os' },
      include: { tenant: true }
    })

    if (demoUser && demoUser.status === 'active') {
      const sessionToken = generateToken()
      
      // Try to create session (non-critical if it fails)
      try {
        await db.session.create({
          data: {
            userId: demoUser.id,
            token: sessionToken,
            deviceInfo: deviceFingerprint,
            ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
            expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
          }
        })
      } catch {}

      // Check if device is registered (non-critical)
      let deviceActivated = true
      try {
        const existingDevice = await db.device.findFirst({
          where: { OR: [{ id: deviceFingerprint }, { deviceName: deviceFingerprint }] }
        })
        deviceActivated = !!existingDevice
      } catch {}

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
    }
  } catch (error) {
    console.error('Demo login DB error:', (error as Error).message)
  }

  // Fallback: static demo response (always works)
  const sessionToken = generateToken()
  return NextResponse.json({
    user: {
      id: 'demo-user-fallback',
      email: 'demo@fleetflow.os',
      name: 'Demo User',
      role: 'demo',
      avatar: null,
      tenant: { id: 'demo-tenant-001', name: 'FleetFlow Demo Corp' },
    },
    sessionToken,
    permissions: ['view_all'],
    deviceActivated: true,
    isDemo: true,
  })
}
