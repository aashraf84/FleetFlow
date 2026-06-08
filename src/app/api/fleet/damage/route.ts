import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const reports = await db.damageReport.findMany({ orderBy: { reportedDate: 'desc' }, include: { vehicle: true, customer: true } })
    return NextResponse.json({ data: reports })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch damage reports' }, { status: 500 })
  }
}

const DAMAGE_REPORT_FIELDS = [
  'vehicleId', 'customerId', 'contractId', 'reportedDate', 'description',
  'severity', 'location', 'repairCost', 'insuranceClaim', 'status', 'photos',
  'notes', 'tenantId',
] as const

function pickDamageFields(body: Record<string, any>) {
  const data: Record<string, any> = {}
  for (const key of DAMAGE_REPORT_FIELDS) {
    if (body[key] !== undefined && body[key] !== '') {
      data[key] = body[key]
    }
  }
  return data
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = pickDamageFields(body)
    const report = await db.damageReport.create({ data })
    return NextResponse.json({ data: report }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create damage report' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    const data = pickDamageFields(rest)
    const report = await db.damageReport.update({ where: { id }, data })
    return NextResponse.json({ data: report })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update damage report' }, { status: 500 })
  }
}
