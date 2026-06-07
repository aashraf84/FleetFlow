import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (token) {
      // Delete the session
      const session = await db.session.findUnique({ where: { token } })
      if (session) {
        await db.auditLog.create({
          data: {
            userId: session.userId,
            action: 'LOGOUT',
            entity: 'User',
            entityId: session.userId,
            details: 'User logged out',
          }
        })
        await db.session.delete({ where: { token } })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
