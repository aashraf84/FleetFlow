import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'No session token' }, { status: 401 })
    }

    const session = await db.session.findUnique({
      where: { token },
      include: { user: { include: { tenant: true } } }
    })

    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    if (new Date() > session.expiresAt) {
      await db.session.delete({ where: { id: session.id } })
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const permissions = getPermissionsForRole(session.user.role)

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        avatar: session.user.avatar,
        tenant: session.user.tenant ? { id: session.user.tenant.id, name: session.user.tenant.name } : null,
      },
      permissions,
      isDemo: session.user.role === 'demo',
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
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
