import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const entries = await db.journalEntry.findMany({ orderBy: { date: 'desc' } })
    const totalDebit = entries.filter(e => e.status === 'posted').reduce((s, e) => s + e.amount, 0)
    const totalCredit = entries.filter(e => e.status === 'posted').reduce((s, e) => s + e.amount, 0)
    const recentEntries = entries.slice(0, 50)
    return NextResponse.json({ data: { entries: recentEntries, totalDebit, totalCredit, balance: totalDebit - totalCredit } })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch accounting data' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const num = `JE-${Date.now().toString(36).toUpperCase()}`
    const entry = await db.journalEntry.create({ data: { ...body, entryNumber: num } })
    return NextResponse.json({ data: entry }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create journal entry' }, { status: 500 })
  }
}
