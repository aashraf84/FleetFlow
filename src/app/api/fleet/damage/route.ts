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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const report = await db.damageReport.create({ data: body })
    return NextResponse.json({ data: report }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create damage report' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const report = await db.damageReport.update({ where: { id }, data })
    return NextResponse.json({ data: report })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update damage report' }, { status: 500 })
  }
}
