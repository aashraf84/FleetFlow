import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || ''
    const status = req.nextUrl.searchParams.get('status') || ''

    const where: any = {}
    if (search) where.OR = [
      { name: { contains: search } },
      { domain: { contains: search } },
    ]
    if (status) where.status = status

    const [tenants, total] = await Promise.all([
      db.tenant.findMany({ where, orderBy: { createdAt: 'desc' } }),
      db.tenant.count({ where }),
    ])

    const stats = {
      total: await db.tenant.count(),
      activeUsers: await db.tenant.aggregate({ _sum: { activeUsers: true } }),
      totalStorage: await db.tenant.aggregate({ _sum: { storageUsed: true } }),
      activeModules: tenants.filter(t => t.status === 'active').reduce((sum, t) => sum + t.modulesEnabled.split(',').length, 0),
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
