import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'No session token' }, { status: 401 })
    }

    const sessions = await sql`
      SELECT s.id, s."expiresAt",
             u.id as "user.id", u.email as "user.email", u.name as "user.name", u.role as "user.role", u.avatar as "user.avatar",
             t.id as "tenant.id", t.name as "tenant.name"
      FROM "Session" s
      JOIN "User" u ON s."userId" = u.id
      LEFT JOIN "Tenant" t ON u."tenantId" = t.id
      WHERE s.token = ${token}
      LIMIT 1
    `

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const session = sessions[0]

    if (new Date() > new Date(session.expiresAt)) {
      try {
        await sql`DELETE FROM "Session" WHERE id = ${session.id}`
      } catch {}
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const permissions = getPermissionsForRole(session['user.role'])

    return NextResponse.json({
      user: {
        id: session['user.id'],
        email: session['user.email'],
        name: session['user.name'],
        role: session['user.role'],
        avatar: session['user.avatar'],
        tenant: session['tenant.id'] ? { id: session['tenant.id'], name: session['tenant.name'] } : null,
      },
      permissions,
      isDemo: session['user.role'] === 'demo',
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
