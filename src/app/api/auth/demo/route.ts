import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

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
    const users = await sql`
      SELECT u.id, u.email, u.name, u.avatar, u.status,
             t.id as "tenant.id", t.name as "tenant.name"
      FROM "User" u
      LEFT JOIN "Tenant" t ON u."tenantId" = t.id
      WHERE u.email = 'demo@fleetflow.os'
      LIMIT 1
    `

    if (users && users.length > 0 && users[0].status === 'active') {
      const demoUser = users[0]
      const sessionToken = generateToken()
      
      // Try to create session (non-critical if it fails)
      try {
        await sql`
          INSERT INTO "Session" (id, "userId", token, "deviceInfo", "ipAddress", "expiresAt", "createdAt")
          VALUES (gen_random_uuid(), ${demoUser.id}, ${sessionToken}, ${deviceFingerprint}, ${req.headers.get('x-forwarded-for') || 'unknown'}, NOW() + interval '4 hours', NOW())
        `
      } catch {}

      // Check if device is registered (non-critical)
      let deviceActivated = true
      try {
        const devices = await sql`
          SELECT id FROM "Device" WHERE id = ${deviceFingerprint} OR "deviceName" = ${deviceFingerprint} LIMIT 1
        `
        deviceActivated = devices && devices.length > 0
      } catch {}

      return NextResponse.json({
        user: {
          id: demoUser.id,
          email: demoUser.email,
          name: demoUser.name,
          role: 'demo',
          avatar: demoUser.avatar,
          tenant: demoUser['tenant.id'] ? { id: demoUser['tenant.id'], name: demoUser['tenant.name'] } : null,
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
