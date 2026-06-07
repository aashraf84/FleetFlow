import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
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

    const conditions: string[] = []
    const params: any[] = []
    let idx = 1

    if (search) {
      conditions.push(`l."licenseKey" ILIKE $${idx++}`)
      params.push(`%${search}%`)
    }
    if (status) {
      conditions.push(`l.status = $${idx++}`)
      params.push(status)
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 2 parallel HTTP queries — filtered licenses + all for stats
    const [licenses, allLicenses] = await Promise.all([
      sql.query(
        `SELECT l.*, row_to_json(cl.*) as client
         FROM "License" l
         LEFT JOIN "Client" cl ON l."clientId" = cl.id
         ${whereClause}
         ORDER BY l."createdAt" DESC`,
        params
      ),
      sql`SELECT status FROM "License"`,
    ])

    const total = (licenses as any[]).length

    const stats = {
      total: (allLicenses as any[]).length,
      active: (allLicenses as any[]).filter(l => l.status === 'active').length,
      expired: (allLicenses as any[]).filter(l => l.status === 'expired').length,
      trial: (allLicenses as any[]).filter(l => l.status === 'trial').length,
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
