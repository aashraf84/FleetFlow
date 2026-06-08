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

const DEPOSIT_FIELDS = [
  'contractId', 'customerId', 'amount', 'type', 'status', 'method',
  'returnedDate', 'returnedAmount', 'notes', 'tenantId',
] as const

function pickDepositFields(body: Record<string, any>) {
  const data: Record<string, any> = {}
  for (const key of DEPOSIT_FIELDS) {
    if (body[key] !== undefined && body[key] !== '') {
      data[key] = body[key]
    }
  }
  return data
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = pickDepositFields(body)
    const deposit = await db.deposit.create({ data })
    return NextResponse.json({ data: deposit }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create deposit' }, { status: 500 })
  }
}
