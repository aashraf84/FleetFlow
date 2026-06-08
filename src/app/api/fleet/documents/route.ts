import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const documents = await db.document.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ data: documents })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

const DOCUMENT_FIELDS = [
  'title', 'type', 'category', 'fileName', 'fileUrl', 'fileSize',
  'relatedEntity', 'relatedEntityId', 'uploadedBy', 'status', 'notes',
  'tenantId',
] as const

function pickDocumentFields(body: Record<string, any>) {
  const data: Record<string, any> = {}
  for (const key of DOCUMENT_FIELDS) {
    if (body[key] !== undefined && body[key] !== '') {
      data[key] = body[key]
    }
  }
  return data
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = pickDocumentFields(body)
    const doc = await db.document.create({ data })
    return NextResponse.json({ data: doc }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    await db.document.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
