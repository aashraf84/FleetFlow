import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
      } else if (existingDevice.status === 'blocked') {
        return NextResponse.json({ error: 'This device has been blocked. Contact support.' }, { status: 403 })
      }
    }

    // Create session
    const sessionToken = generateToken()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await db.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        deviceInfo: deviceFingerprint || 'unknown',
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        expiresAt,
      }
    })

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date(), lastLoginIp: req.headers.get('x-forwarded-for') || 'unknown' }
    })

    // Log audit
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        details: 'User logged in successfully',
      }
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
