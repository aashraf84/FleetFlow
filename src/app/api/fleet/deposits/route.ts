import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const deposits = await db.deposit.findMany({ orderBy: { createdAt: 'desc' }, include: { customer: true, contract: { include: { customer: true, vehicle: true } } } })
    return NextResponse.json({ data: deposits })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch deposits' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const deposit = await db.deposit.create({ data: body })
    return NextResponse.json({ data: deposit }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create deposit' }, { status: 500 })
  }
}
