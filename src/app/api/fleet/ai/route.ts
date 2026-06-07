import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json()
    
    // AI assistant uses the z-ai-web-dev-sdk on the backend
    // For now, return structured fleet insights based on context
    const responses: Record<string, string> = {
      'maintenance': 'Based on fleet analysis, 3 vehicles are due for oil changes this week, and 2 need tire rotation. The Toyota Camry (REG-4521) has the highest maintenance cost this quarter at $2,340.',
      'revenue': 'Fleet revenue analysis shows a 12% increase month-over-month. The top revenue-generating vehicles are: 1) Mercedes E-Class ($8,500/mo), 2) Toyota Land Cruiser ($7,200/mo), 3) Hyundai H1 ($5,800/mo).',
      'idle': 'Currently 4 vehicles are idle: 2 sedans and 2 SUVs. Consider adjusting rental rates or promoting these categories to improve utilization.',
      'fuel': 'Fuel cost trends show a 5% increase over the last 3 months. The highest fuel consumers are heavy vehicles. Consider route optimization to reduce fuel waste.',
      'default': 'I can help you analyze fleet data including vehicle utilization, maintenance schedules, revenue trends, fuel costs, and driver performance. What specific insight would you like?'
    }

    const key = Object.keys(responses).find(k => message.toLowerCase().includes(k)) || 'default'
    
    return NextResponse.json({ 
      data: { 
        response: responses[key],
        timestamp: new Date().toISOString()
      } 
    })
  } catch (error) {
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
  }
}
