import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const parts = await db.sparePart.findMany({ orderBy: { name: 'asc' } })
    const purchaseOrders = await db.purchaseOrder.findMany({ orderBy: { createdAt: 'desc' }, include: { items: true } })
    const lowStock = parts.filter(p => p.quantityInStock <= p.reorderLevel)
    return NextResponse.json({ data: { parts, purchaseOrders, lowStock } })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch parts data' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const part = await db.sparePart.create({ data: body })
    return NextResponse.json({ data: part }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create spare part' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const part = await db.sparePart.update({ where: { id }, data })
    return NextResponse.json({ data: part })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update spare part' }, { status: 500 })
  }
}
