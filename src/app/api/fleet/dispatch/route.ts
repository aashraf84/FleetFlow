import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const orders = await db.dispatchOrder.findMany({ orderBy: { createdAt: 'desc' }, include: { driver: true, trips: true } })
    return NextResponse.json({ data: orders })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dispatch orders' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const num = `DSP-${Date.now().toString(36).toUpperCase()}`
    const order = await db.dispatchOrder.create({ data: { ...body, orderNumber: num } })
    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create dispatch order' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const order = await db.dispatchOrder.update({ where: { id }, data })
    return NextResponse.json({ data: order })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update dispatch order' }, { status: 500 })
  }
}
