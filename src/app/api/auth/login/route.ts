import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function getPermissionsForRole(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    super_owner: ['*'],
    client_owner: ['view_all', 'edit_all', 'manage_users', 'manage_subscription', 'manage_license'],
    fleet_manager: ['view_fleet', 'edit_fleet', 'view_rental', 'edit_rental', 'view_maintenance', 'edit_maintenance'],
    rental_manager: ['view_rental', 'edit_rental', 'view_customer', 'edit_customer', 'view_finance'],
    dispatcher: ['view_dispatch', 'edit_dispatch', 'view_trips', 'edit_trips', 'view_gps'],
    driver: ['view_own_trips', 'view_own_schedule', 'edit_own_status'],
    accountant: ['view_finance', 'edit_finance', 'view_invoices', 'edit_invoices', 'view_expenses'],
    hr_manager: ['view_hr', 'edit_hr', 'view_employees', 'edit_employees', 'view_payroll'],
    mechanic: ['view_maintenance', 'edit_maintenance', 'view_workshop', 'edit_workshop', 'view_parts'],
    customer: ['view_own_reservations', 'view_own_contracts', 'edit_own_profile'],
    demo: ['view_all'],
  }
  return rolePermissions[role] || ['view_own_profile']
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, deviceFingerprint } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // Use HTTP-based SQL for user lookup (no TCP connection pool)
    const users = await sql`
      SELECT u.id, u.email, u.name, u.password, u.role, u.avatar, u.status, u."tenantId",
             t.id as "tenant.id", t.name as "tenant.name"
      FROM "User" u
      LEFT JOIN "Tenant" t ON u."tenantId" = t.id
      WHERE u.email = ${email}
      LIMIT 1
    `

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const user = users[0]

    // Simple password check
    if (user.password !== password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (user.status !== 'active') {
      return NextResponse.json({ error: 'Account is inactive or suspended' }, { status: 403 })
    }

    // Check device activation for new devices
    let deviceActivated = true
    if (deviceFingerprint) {
      try {
        const devices = await sql`
          SELECT id, status FROM "Device" 
          WHERE id = ${deviceFingerprint} OR "deviceName" = ${deviceFingerprint}
          LIMIT 1
        `
        if (!devices || devices.length === 0) {
          // Super_owner: auto-register device as approved
          if (user.role === 'super_owner') {
            await sql`
              INSERT INTO "Device" (id, "userId", "deviceName", "ipAddress", "lastLogin", location, status, "createdAt")
              VALUES (${deviceFingerprint}, ${user.id}, 'Owner Device', ${req.headers.get('x-forwarded-for') || 'unknown'}, NOW(), 'Owner Device', 'approved', NOW())
              ON CONFLICT (id) DO NOTHING
            `
            deviceActivated = true
          } else {
            deviceActivated = false
          }
        } else if (devices[0].status === 'blocked') {
          return NextResponse.json({ error: 'This device has been blocked. Contact support.' }, { status: 403 })
        }
      } catch (deviceError) {
        console.error('Device check error:', (deviceError as Error).message)
        if (user.role !== 'super_owner') {
          deviceActivated = false
        }
      }
    }

    // Create session token
    const sessionToken = generateToken()
    const ip = req.headers.get('x-forwarded-for') || 'unknown'

    // Run non-critical DB operations (using HTTP-based SQL)
    try {
      await sql`
        INSERT INTO "Session" (id, "userId", token, "deviceInfo", "ipAddress", "expiresAt", "createdAt")
        VALUES (gen_random_uuid(), ${user.id}, ${sessionToken}, ${deviceFingerprint || 'unknown'}, ${ip}, NOW() + interval '24 hours', NOW())
      `
    } catch (e) {
      console.error('Session create failed:', (e as Error).message)
    }

    try {
      await sql`
        UPDATE "User" SET "lastLogin" = NOW(), "lastLoginIp" = ${ip}, "updatedAt" = NOW()
        WHERE id = ${user.id}
      `
    } catch (e) {
      console.error('User update failed:', (e as Error).message)
    }

    try {
      await sql`
        INSERT INTO "AuditLog" (id, "userId", action, entity, "entityId", "ipAddress", details, "createdAt")
        VALUES (gen_random_uuid(), ${user.id}, 'LOGIN', 'User', ${user.id}, ${ip}, 'User logged in successfully', NOW())
      `
    } catch (e) {
      console.error('Audit log failed:', (e as Error).message)
    }

    const permissions = getPermissionsForRole(user.role)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        tenant: user['tenant.id'] ? { id: user['tenant.id'], name: user['tenant.name'] } : null,
      },
      sessionToken,
      permissions,
      deviceActivated,
      isDemo: false,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
