import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || ''
    const status = req.nextUrl.searchParams.get('status') || ''

    const where: any = {}
    if (search) where.OR = [
      { deviceName: { contains: search } },
      { ipAddress: { contains: search } },
      { browser: { contains: search } },
    ]
    if (status) where.status = status

    const [devices, total] = await Promise.all([
      db.device.findMany({ where, orderBy: { createdAt: 'desc' } }),
      db.device.count({ where }),
    ])

    const stats = {
      total: await db.device.count(),
      approved: await db.device.count({ where: { status: 'approved' } }),
      blocked: await db.device.count({ where: { status: 'blocked' } }),
      pending: await db.device.count({ where: { status: 'pending' } }),
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
