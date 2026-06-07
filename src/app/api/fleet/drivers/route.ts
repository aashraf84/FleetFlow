import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    const conditions: string[] = []
    const params: any[] = []
    let idx = 1

    if (status) {
      conditions.push(`status = $${idx++}`)
      params.push(status)
    }
    if (search) {
      conditions.push(`("firstName" ILIKE $${idx} OR "lastName" ILIKE $${idx} OR email ILIKE $${idx} OR "licenseNumber" ILIKE $${idx})`)
      params.push(`%${search}%`)
      idx++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const drivers = await sql.query(
      `SELECT * FROM "Driver" ${whereClause} ORDER BY "createdAt" DESC`,
      params
    )

    return NextResponse.json({ data: drivers })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const driver = await db.driver.create({ data: body })
    return NextResponse.json({ data: driver }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create driver' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const driver = await db.driver.update({ where: { id }, data })
    return NextResponse.json({ data: driver })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.driver.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete driver' }, { status: 500 })
  }
}
