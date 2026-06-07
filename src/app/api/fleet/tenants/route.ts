import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || ''
    const status = req.nextUrl.searchParams.get('status') || ''

    // Build WHERE conditions for filtered query
    const conditions: string[] = []
    const params: any[] = []
    let idx = 1

    if (search) {
      conditions.push(`(name ILIKE $${idx} OR domain ILIKE $${idx})`)
      params.push(`%${search}%`)
      idx++
    }
    if (status) {
      conditions.push(`status = $${idx++}`)
      params.push(status)
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 2 parallel HTTP queries — filtered tenants + all tenants for stats
    const [tenants, allTenants] = await Promise.all([
      sql.query(
        `SELECT * FROM "Tenant" ${whereClause} ORDER BY "createdAt" DESC`,
        params
      ),
      sql`SELECT status, "activeUsers", "storageUsed", "modulesEnabled" FROM "Tenant"`,
    ])

    const total = (tenants as any[]).length

    const stats = {
      total: (allTenants as any[]).length,
      activeUsers: (allTenants as any[]).reduce((sum: number, t: any) => sum + (t.activeUsers || 0), 0),
      totalStorage: (allTenants as any[]).reduce((sum: number, t: any) => sum + (t.storageUsed || 0), 0),
      activeModules: (allTenants as any[]).filter((t: any) => t.status === 'active').reduce((sum: number, t: any) => sum + t.modulesEnabled.split(',').length, 0),
    }

    return NextResponse.json({ data: tenants, stats, total })
  } catch (error) {
    console.error('Tenants GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const tenant = await db.tenant.create({ data: body })
    return NextResponse.json({ data: tenant })
  } catch (error) {
    console.error('Tenants POST error:', error)
    return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const tenant = await db.tenant.update({ where: { id }, data })
    return NextResponse.json({ data: tenant })
  } catch (error) {
    console.error('Tenants PUT error:', error)
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.tenant.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Tenants DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete tenant' }, { status: 500 })
  }
}
