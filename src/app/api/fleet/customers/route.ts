import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')

    if (search) {
      const customers = await sql.query(
        `SELECT * FROM "Customer" 
         WHERE "firstName" ILIKE $1 OR "lastName" ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR "drivingLicense" ILIKE $1
         ORDER BY "createdAt" DESC`,
        [`%${search}%`]
      )
      return NextResponse.json({ data: customers })
    }

    const customers = await sql`SELECT * FROM "Customer" ORDER BY "createdAt" DESC`
    return NextResponse.json({ data: customers })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}

const CUSTOMER_FIELDS = [
  'firstName', 'lastName', 'email', 'phone', 'address', 'city', 'country',
  'nationality', 'idNumber', 'drivingLicense', 'licenseExpiry', 'dateOfBirth',
  'emergencyContact', 'emergencyPhone', 'status', 'notes', 'tenantId',
] as const

function pickCustomerFields(body: Record<string, any>) {
  const data: Record<string, any> = {}
  for (const key of CUSTOMER_FIELDS) {
    if (body[key] !== undefined && body[key] !== '') {
      data[key] = body[key]
    }
  }
  return data
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = pickCustomerFields(body)
    const customer = await db.customer.create({ data })
    return NextResponse.json({ data: customer }, { status: 201 })
  } catch (error) {
    console.error('Customer POST error:', error)
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    const data = pickCustomerFields(rest)
    const customer = await db.customer.update({ where: { id }, data })
    return NextResponse.json({ data: customer })
  } catch (error) {
    console.error('Customer PUT error:', error)
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.customer.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }
}
