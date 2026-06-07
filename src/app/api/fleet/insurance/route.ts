import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const policies = await db.insurancePolicy.findMany({ orderBy: { endDate: 'asc' }, include: { vehicle: true } })
    return NextResponse.json({ data: policies })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch insurance policies' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const policy = await db.insurancePolicy.create({ data: body })
    return NextResponse.json({ data: policy }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create insurance policy' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const policy = await db.insurancePolicy.update({ where: { id }, data })
    return NextResponse.json({ data: policy })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update insurance policy' }, { status: 500 })
  }
}
