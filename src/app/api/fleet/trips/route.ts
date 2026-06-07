import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const trips = await db.trip.findMany({ orderBy: { createdAt: 'desc' }, include: { dispatchOrder: true, driver: true, fuelRecords: true } })
    return NextResponse.json({ data: trips })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const trip = await db.trip.create({ data: body })
    return NextResponse.json({ data: trip }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const trip = await db.trip.update({ where: { id }, data })
    return NextResponse.json({ data: trip })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 })
  }
}
