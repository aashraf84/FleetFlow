import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/sql'
import ZAI from 'z-ai-web-dev-sdk'

// Singleton ZAI instance for reuse across requests
let zaiInstance: any = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Gather real fleet data from DB to provide context to the AI
    let fleetContext = ''
    try {
      const [vehicles, reservations, drivers, expenses, maintenance] = await Promise.all([
        sql`SELECT status, COUNT(*)::int as count FROM "Vehicle" GROUP BY status`,
        sql`SELECT COUNT(*)::int as total, COALESCE(SUM("totalAmount"), 0) as revenue FROM "Reservation"`,
        sql`SELECT status, COUNT(*)::int as count FROM "Driver" GROUP BY status`,
        sql`SELECT COALESCE(SUM(amount), 0) as total, category FROM "Expense" GROUP BY category`,
        sql`SELECT status, COUNT(*)::int as count FROM "MaintenanceRecord" GROUP BY status`,
      ])

      const vehicleStatus = (vehicles as any[]).map((v: any) => `${v.status}: ${v.count}`).join(', ')
      const driverStatus = (drivers as any[]).map((d: any) => `${d.status}: ${d.count}`).join(', ')
      const expenseBreakdown = (expenses as any[]).map((e: any) => `${e.category}: $${Math.round(e.total)}`).join(', ')
      const maintenanceStatus = (maintenance as any[]).map((m: any) => `${m.status}: ${m.count}`).join(', ')
      const resData = reservations as any[]

      fleetContext = `Current Fleet Data:
- Vehicle Status: ${vehicleStatus || 'No data'}
- Total Reservations: ${resData[0]?.total || 0}, Revenue: $${Math.round(resData[0]?.revenue || 0)}
- Driver Status: ${driverStatus || 'No data'}
- Expenses by Category: ${expenseBreakdown || 'No data'}
- Maintenance Status: ${maintenanceStatus || 'No data'}`
    } catch (dbError) {
      fleetContext = 'Fleet data temporarily unavailable.'
    }

    // Use z-ai-web-dev-sdk for real LLM-powered responses
    const zai = await getZAI()

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are FleetFlow OS AI Assistant, an intelligent fleet management advisor. You have access to real-time fleet data and provide actionable insights, recommendations, and analysis. Be concise, professional, and data-driven. When relevant, reference the actual fleet data provided. If asked about something outside fleet management, politely redirect to fleet-related topics.

${fleetContext}`
        },
        {
          role: 'user',
          content: message
        }
      ],
      thinking: { type: 'disabled' }
    })

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, I was unable to process your request. Please try again.'

    return NextResponse.json({
      data: {
        response: aiResponse,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('AI route error:', error)
    // Fallback: provide a basic response if LLM fails
    return NextResponse.json({
      data: {
        response: 'I\'m currently experiencing a high volume of requests. Please try again in a moment, or explore the dashboard for real-time fleet insights.',
        timestamp: new Date().toISOString()
      }
    })
  }
}
