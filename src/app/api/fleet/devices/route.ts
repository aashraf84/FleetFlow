import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || ''
    const status = req.nextUrl.searchParams.get('status') || ''

    const conditions: string[] = []
    const params: any[] = []
    let idx = 1

    if (search) {
      conditions.push(`("deviceName" ILIKE $${idx} OR "ipAddress" ILIKE $${idx} OR browser ILIKE $${idx})`)
      params.push(`%${search}%`)
      idx++
    }
    if (status) {
      conditions.push(`status = $${idx++}`)
      params.push(status)
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // 2 parallel HTTP queries — filtered devices + all for stats
    const [devices, allDevices] = await Promise.all([
      sql.query(
        `SELECT * FROM "Device" ${whereClause} ORDER BY "createdAt" DESC`,
        params
      ),
      sql`SELECT status FROM "Device"`,
    ])

    const total = (devices as any[]).length

    const stats = {
      total: (allDevices as any[]).length,
      approved: (allDevices as any[]).filter(d => d.status === 'approved').length,
      blocked: (allDevices as any[]).filter(d => d.status === 'blocked').length,
      pending: (allDevices as any[]).filter(d => d.status === 'pending').length,
    }

    return NextResponse.json({ data: devices, stats, total })
  } catch (error) {
    console.error('Devices GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch devices' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const device = await db.device.create({ data: body })
    return NextResponse.json({ data: device })
  } catch (error) {
    console.error('Devices POST error:', error)
    return NextResponse.json({ error: 'Failed to create device' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const device = await db.device.update({ where: { id }, data })
    return NextResponse.json({ data: device })
  } catch (error) {
    console.error('Devices PUT error:', error)
    return NextResponse.json({ error: 'Failed to update device' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.device.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Devices DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete device' }, { status: 500 })
  }
}
