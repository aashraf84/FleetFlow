import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const records = await db.complianceRecord.findMany({ orderBy: { expiryDate: 'asc' }, include: { vehicle: true } })
    return NextResponse.json({ data: records })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch compliance records' }, { status: 500 })
  }
}

const COMPLIANCE_RECORD_FIELDS = [
  'vehicleId', 'type', 'documentNumber', 'issueDate', 'expiryDate',
  'issuingAuthority', 'status', 'notes', 'tenantId',
] as const

function pickComplianceFields(body: Record<string, any>) {
  const data: Record<string, any> = {}
  for (const key of COMPLIANCE_RECORD_FIELDS) {
    if (body[key] !== undefined && body[key] !== '') {
      data[key] = body[key]
    }
  }
  return data
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = pickComplianceFields(body)
    const record = await db.complianceRecord.create({ data })
    return NextResponse.json({ data: record }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create compliance record' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    const data = pickComplianceFields(rest)
    const record = await db.complianceRecord.update({ where: { id }, data })
    return NextResponse.json({ data: record })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update compliance record' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.complianceRecord.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete compliance record' }, { status: 500 })
  }
}
