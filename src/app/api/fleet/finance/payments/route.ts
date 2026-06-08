import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const payments = await db.payment.findMany({ orderBy: { paidDate: 'desc' }, include: { invoice: true } })
    return NextResponse.json({ data: payments })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const payment = await db.payment.create({ data: body })
    if (body.invoiceId) {
      const invoice = await db.invoice.findUnique({ where: { id: body.invoiceId }, include: { payments: true } })
      if (invoice) {
        const totalPaid = invoice.payments.reduce((s, p) => s + (p.status === 'completed' ? p.amount : 0), 0) + (body.status === 'completed' ? body.amount : 0)
        if (totalPaid >= invoice.totalAmount) {
          await db.invoice.update({ where: { id: body.invoiceId }, data: { status: 'paid', paidDate: new Date() } })
        } else if (totalPaid > 0) {
          await db.invoice.update({ where: { id: body.invoiceId }, data: { status: 'partial' } })
        }
      }
    }
    return NextResponse.json({ data: payment }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const payment = await db.payment.update({ where: { id }, data })
    return NextResponse.json({ data: payment })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.payment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
  }
}
