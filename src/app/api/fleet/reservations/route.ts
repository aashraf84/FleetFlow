import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const where: any = {}
    if (status) where.status = status
    const reservations = await db.reservation.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { customer: true, vehicle: true }
    })
    return NextResponse.json({ data: reservations })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const code = `RES-${Date.now().toString(36).toUpperCase()}`
    const reservation = await db.reservation.create({ data: { ...body, reservationCode: code } })
    return NextResponse.json({ data: reservation }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const reservation = await db.reservation.update({ where: { id }, data })
    return NextResponse.json({ data: reservation })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update reservation' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.reservation.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete reservation' }, { status: 500 })
  }
}
