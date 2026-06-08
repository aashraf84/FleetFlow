import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // 2 parallel HTTP queries — fetch parts and purchase orders
    const [parts, purchaseOrders] = await Promise.all([
      sql`SELECT * FROM "SparePart" ORDER BY name ASC`,
      sql`SELECT po.*,
                 COALESCE(
                   (SELECT json_agg(row_to_json(poi.*)) FROM "PurchaseOrderItem" poi WHERE poi."purchaseOrderId" = po.id),
                   '[]'::json
                 ) as items
          FROM "PurchaseOrder" po
          ORDER BY po."createdAt" DESC`,
    ])

    const lowStock = (parts as any[]).filter(p => p.quantityInStock <= p.reorderLevel)
    return NextResponse.json({ data: { parts, purchaseOrders, lowStock } })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch parts data' }, { status: 500 })
  }
}

const SPARE_PART_FIELDS = [
  'name', 'partNumber', 'category', 'quantityInStock', 'reorderLevel',
  'unitCost', 'sellingPrice', 'supplier', 'location', 'tenantId',
] as const

function pickSparePartFields(body: Record<string, any>) {
  const data: Record<string, any> = {}
  for (const key of SPARE_PART_FIELDS) {
    if (body[key] !== undefined && body[key] !== '') {
      data[key] = body[key]
    }
  }
  return data
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = pickSparePartFields(body)
    const part = await db.sparePart.create({ data })
    return NextResponse.json({ data: part }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create spare part' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    const data = pickSparePartFields(rest)
    const part = await db.sparePart.update({ where: { id }, data })
    return NextResponse.json({ data: part })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update spare part' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.sparePart.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete spare part' }, { status: 500 })
  }
}
