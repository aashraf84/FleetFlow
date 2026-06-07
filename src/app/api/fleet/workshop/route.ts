import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const jobCards = await db.jobCard.findMany({ orderBy: { createdAt: 'desc' }, include: { maintenance: { include: { vehicle: true } } } })
    return NextResponse.json({ data: jobCards })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch workshop data' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const jobCard = await db.jobCard.create({ data: body })
    return NextResponse.json({ data: jobCard }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create job card' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const jobCard = await db.jobCard.update({ where: { id }, data })
    return NextResponse.json({ data: jobCard })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update job card' }, { status: 500 })
  }
}
