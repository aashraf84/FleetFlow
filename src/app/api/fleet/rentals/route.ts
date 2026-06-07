import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const where: any = {}
    if (status) where.status = status
    const contracts = await db.rentalContract.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { customer: true, vehicle: true, reservation: true }
    })
    return NextResponse.json({ data: contracts })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const num = `CTR-${Date.now().toString(36).toUpperCase()}`
    const contract = await db.rentalContract.create({ data: { ...body, contractNumber: num } })
    return NextResponse.json({ data: contract }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const contract = await db.rentalContract.update({ where: { id }, data })
    return NextResponse.json({ data: contract })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 })
  }
}
