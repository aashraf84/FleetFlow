import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const where: any = {}
    if (status) where.status = status
    const invoices = await db.invoice.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { customer: true, items: true, payments: true }
    })
    return NextResponse.json({ data: invoices })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}

const INVOICE_FIELDS = [
  'invoiceNumber', 'customerId', 'issueDate', 'dueDate', 'subtotal',
  'taxAmount', 'totalAmount', 'paidAmount', 'status', 'paidDate', 'notes',
  'tenantId',
] as const

function pickInvoiceFields(body: Record<string, any>) {
  const data: Record<string, any> = {}
  for (const key of INVOICE_FIELDS) {
    if (body[key] !== undefined && body[key] !== '') {
      data[key] = body[key]
    }
  }
  return data
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { items, ...rest } = body
    const num = `INV-${Date.now().toString(36).toUpperCase()}`
    const invoiceData = pickInvoiceFields(rest)
    const invoice = await db.invoice.create({
      data: {
        ...invoiceData,
        invoiceNumber: num,
        items: items ? { create: items } : undefined,
      },
      include: { items: true }
    })
    return NextResponse.json({ data: invoice }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, items, ...rest } = body
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const data = pickInvoiceFields(rest)

    // If items are provided, replace them
    if (items) {
      await db.invoiceItem.deleteMany({ where: { invoiceId: id } })
      await db.invoice.update({
        where: { id },
        data: {
          ...data,
          items: { create: items },
        },
      })
      const updated = await db.invoice.findUnique({ where: { id }, include: { items: true, customer: true } })
      return NextResponse.json({ data: updated })
    }

    const invoice = await db.invoice.update({ where: { id }, data, include: { items: true, customer: true } })
    return NextResponse.json({ data: invoice })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.invoiceItem.deleteMany({ where: { invoiceId: id } })
    await db.invoice.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 })
  }
}
