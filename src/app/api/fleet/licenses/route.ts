import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
function genKey(): string {
  const seg = () => Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
  return `FF-${seg()}-${seg()}-${seg()}`
}

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || ''
    const status = req.nextUrl.searchParams.get('status') || ''

    const where: any = {}
    if (search) where.OR = [{ licenseKey: { contains: search } }]
    if (status) where.status = status

    const [licenses, total] = await Promise.all([
      db.license.findMany({
        where,
        include: { client: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.license.count({ where }),
    ])

    const stats = {
      total: await db.license.count(),
      active: await db.license.count({ where: { status: 'active' } }),
      expired: await db.license.count({ where: { status: 'expired' } }),
      trial: await db.license.count({ where: { status: 'trial' } }),
    }

    return NextResponse.json({ data: licenses, stats, total })
  } catch (error) {
    console.error('Licenses GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch licenses' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const license = await db.license.create({
      data: {
        ...body,
        licenseKey: genKey(),
      }
    })
    return NextResponse.json({ data: license })
  } catch (error) {
    console.error('Licenses POST error:', error)
    return NextResponse.json({ error: 'Failed to create license' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const license = await db.license.update({ where: { id }, data })
    return NextResponse.json({ data: license })
  } catch (error) {
    console.error('Licenses PUT error:', error)
    return NextResponse.json({ error: 'Failed to update license' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.license.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Licenses DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete license' }, { status: 500 })
  }
}
