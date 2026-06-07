import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const conditions: string[] = []
    const params: any[] = []
    let idx = 1

    if (category) {
      conditions.push(`category = $${idx++}`)
      params.push(category)
    }
    if (status) {
      conditions.push(`status = $${idx++}`)
      params.push(status)
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const expenses = await sql.query(
      `SELECT * FROM "Expense" ${whereClause} ORDER BY date DESC`,
      params
    )

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
    const expense = await db.expense.update({ where: { id }, data })
    return NextResponse.json({ data: expense })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}
