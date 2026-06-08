import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const where: any = {}
    if (category) where.category = category
    if (status) where.status = status

    const expenses = await db.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    })

    return NextResponse.json({ data: expenses })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const expense = await db.expense.create({ data: body })
    return NextResponse.json({ data: expense }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const expense = await db.expense.update({ where: { id }, data })
    return NextResponse.json({ data: expense })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.expense.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
