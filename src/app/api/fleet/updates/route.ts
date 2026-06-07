import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || ''
    const status = req.nextUrl.searchParams.get('status') || ''

    const where: any = {}
    if (search) where.OR = [{ version: { contains: search } }, { releaseNotes: { contains: search } }]
    if (status) where.status = status

    const [updates, total] = await Promise.all([
      db.updateRecord.findMany({ where, orderBy: { createdAt: 'desc' } }),
      db.updateRecord.count({ where }),
    ])

    const stats = {
      total: await db.updateRecord.count(),
      published: await db.updateRecord.count({ where: { status: 'published' } }),
      critical: await db.updateRecord.count({ where: { isCritical: true } }),
      latestVersion: (await db.updateRecord.findFirst({ where: { status: 'published' }, orderBy: { createdAt: 'desc' } }))?.version || 'N/A',
    }

    return NextResponse.json({ data: updates, stats, total })
  } catch (error) {
    console.error('Updates GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch updates' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const update = await db.updateRecord.create({ data: body })
    return NextResponse.json({ data: update })
  } catch (error) {
    console.error('Updates POST error:', error)
    return NextResponse.json({ error: 'Failed to create update' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const update = await db.updateRecord.update({ where: { id }, data })
    return NextResponse.json({ data: update })
  } catch (error) {
    console.error('Updates PUT error:', error)
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.updateRecord.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Updates DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete update' }, { status: 500 })
  }
}
