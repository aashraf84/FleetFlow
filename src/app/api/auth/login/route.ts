import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    const user = await db.user.findUnique({
      where: { email },
      include: { tenant: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

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
        const existingDevice = await db.device.findFirst({
          where: { 
            OR: [
              { id: deviceFingerprint },
              { deviceName: deviceFingerprint }
            ]
          }
        })
        if (!existingDevice) {
          // Super_owner: auto-register device as approved (platform owner bypasses serial key)
          if (user.role === 'super_owner') {
            await db.device.create({
              data: {
                id: deviceFingerprint,
                userId: user.id,
                deviceName: 'Owner Device',
                ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
                lastLogin: new Date(),
                location: 'Owner Device',
                status: 'approved',
              }
            })
            deviceActivated = true
          } else {
            deviceActivated = false
          }
        } else if (existingDevice.status === 'blocked') {
          return NextResponse.json({ error: 'This device has been blocked. Contact support.' }, { status: 403 })
        }
      } catch (deviceError) {
        // Non-critical: if device check fails, still allow login for super_owner
        console.error('Device check error:', (deviceError as Error).message)
        if (user.role !== 'super_owner') {
          deviceActivated = false
        }
      }
    }

    // Create session
    const sessionToken = generateToken()

    // Run non-critical DB operations with error handling
    const results = await Promise.allSettled([
      db.session.create({
        data: {
          userId: user.id,
          token: sessionToken,
          deviceInfo: deviceFingerprint || 'unknown',
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }
      }),
      db.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date(), lastLoginIp: req.headers.get('x-forwarded-for') || 'unknown' }
      }),
      db.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          entity: 'User',
          entityId: user.id,
          ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
          details: 'User logged in successfully',
        }
      }),
    ])
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') return
      console.error(`Non-critical DB op ${i} failed:`, r.reason?.message)
    })

    const permissions = getPermissionsForRole(user.role)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        tenant: user.tenant ? { id: user.tenant.id, name: user.tenant.name } : null,
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
