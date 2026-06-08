import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    if (status) {
      const contracts = await sql.query(
        `SELECT rc.*,
                row_to_json(c.*) as customer,
                row_to_json(v.*) as vehicle,
                row_to_json(r.*) as reservation
         FROM "RentalContract" rc
         LEFT JOIN "Customer" c ON rc."customerId" = c.id
         LEFT JOIN "Vehicle" v ON rc."vehicleId" = v.id
         LEFT JOIN "Reservation" r ON rc."reservationId" = r.id
         WHERE rc.status = $1
         ORDER BY rc."createdAt" DESC`,
        [status]
      )
      return NextResponse.json({ data: contracts })
    }

    const contracts = await sql`
      SELECT rc.*,
             row_to_json(c.*) as customer,
             row_to_json(v.*) as vehicle,
             row_to_json(r.*) as reservation
      FROM "RentalContract" rc
      LEFT JOIN "Customer" c ON rc."customerId" = c.id
      LEFT JOIN "Vehicle" v ON rc."vehicleId" = v.id
      LEFT JOIN "Reservation" r ON rc."reservationId" = r.id
      ORDER BY rc."createdAt" DESC`

    return NextResponse.json({ data: contracts })
  } catch (error) {
    console.error('Rentals GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
  }
}

const RENTAL_CONTRACT_FIELDS = [
  'contractNumber', 'reservationId', 'customerId', 'vehicleId', 'startDate',
  'endDate', 'dailyRate', 'totalDays', 'totalAmount', 'depositAmount',
  'mileageLimit', 'mileageOut', 'mileageIn', 'terms', 'status',
  'signedDate', 'returnDate', 'notes', 'tenantId',
] as const

function pickRentalContractFields(body: Record<string, any>) {
  const data: Record<string, any> = {}
  for (const key of RENTAL_CONTRACT_FIELDS) {
    if (body[key] !== undefined && body[key] !== '') {
      data[key] = body[key]
    }
  }
  return data
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const num = `CTR-${Date.now().toString(36).toUpperCase()}`

    // Calculate totalDays and totalAmount if not provided
    const startDate = new Date(body.startDate)
    const endDate = new Date(body.endDate)
    const diffMs = endDate.getTime() - startDate.getTime()
    const totalDays = body.totalDays || Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    const totalAmount = body.totalAmount || (totalDays * (body.dailyRate || 0))

    const filtered = pickRentalContractFields(body)
    const contract = await db.rentalContract.create({
      data: {
        ...filtered,
        contractNumber: num,
        totalDays,
        totalAmount,
      }
    })

    // If contract is active, update vehicle status to rented
    if (contract.status === 'active') {
      await db.vehicle.update({ where: { id: contract.vehicleId }, data: { status: 'rented' } })
    }

    return NextResponse.json({ data: contract }, { status: 201 })
  } catch (error) {
    console.error('Rentals POST error:', error)
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, statusChange, ...data } = body

    if (!id) return NextResponse.json({ error: 'Contract ID required' }, { status: 400 })

    // Fetch current contract for validation
    const current = await db.rentalContract.findUnique({ where: { id } })
    if (!current) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })

    // Handle status transitions
    if (statusChange) {
      const validTransitions: Record<string, string[]> = {
        draft: ['active'],
        active: ['completed', 'terminated'],
        completed: [],
        terminated: [],
        breached: [],
      }
      const allowed = validTransitions[current.status] || []
      if (!allowed.includes(statusChange)) {
        return NextResponse.json({ error: `Cannot transition from ${current.status} to ${statusChange}` }, { status: 400 })
      }

      const updateData: any = { status: statusChange }

      if (statusChange === 'active') {
        updateData.signedDate = new Date()
        // Update vehicle status to rented
        await db.vehicle.update({ where: { id: current.vehicleId }, data: { status: 'rented' } })
      }

      if (statusChange === 'completed') {
        updateData.returnDate = new Date()
        // Update vehicle status back to available
        await db.vehicle.update({ where: { id: current.vehicleId }, data: { status: 'available' } })
      }

      if (statusChange === 'terminated') {
        updateData.returnDate = new Date()
        // Update vehicle status back to available
        await db.vehicle.update({ where: { id: current.vehicleId }, data: { status: 'available' } })
      }

      // Apply mileage changes if provided
      if (data.mileageOut !== undefined) updateData.mileageOut = data.mileageOut
      if (data.mileageIn !== undefined) updateData.mileageIn = data.mileageIn
      if (data.notes !== undefined) updateData.notes = data.notes
      if (data.returnDate !== undefined) updateData.returnDate = data.returnDate

      const contract = await db.rentalContract.update({ where: { id }, data: updateData })
      return NextResponse.json({ data: contract })
    }

    // Regular update
    const updateData = pickRentalContractFields(data)
    const contract = await db.rentalContract.update({ where: { id }, data: updateData })
    return NextResponse.json({ data: contract })
  } catch (error) {
    console.error('Rentals PUT error:', error)
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    // Only allow deleting draft contracts
    const contract = await db.rentalContract.findUnique({ where: { id } })
    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    if (contract.status !== 'draft') return NextResponse.json({ error: 'Only draft contracts can be deleted' }, { status: 400 })

    await db.rentalContract.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Rentals DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 })
  }
}
