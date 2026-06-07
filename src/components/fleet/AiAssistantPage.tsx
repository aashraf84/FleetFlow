'use client'
import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, Send, Sparkles, Wrench, TrendingUp, Fuel, Car } from 'lucide-react'
import { toast } from 'sonner'

interface Message { role: 'user' | 'assistant'; content: string; time: Date }

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I\'m your FleetFlow AI Assistant. I can help you analyze fleet data, predict maintenance needs, optimize pricing, and generate business insights. Try asking me about vehicle maintenance, revenue trends, idle vehicles, or fuel costs.', time: new Date() }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const suggestions = [
    { icon: Wrench, label: 'Show vehicles due for maintenance', query: 'Which vehicles are due for maintenance?' },
    { icon: TrendingUp, label: 'Show highest revenue vehicles', query: 'Show me the highest revenue vehicles' },
    { icon: Car, label: 'Show idle vehicles', query: 'Which vehicles are currently idle?' },
    { icon: Fuel, label: 'Show fuel cost trends', query: 'What are the fuel cost trends?' },
  ]

  const handleSend = async (text?: string) => {
    const message = text || input
    if (!message.trim()) return

    setMessages(prev => [...prev, { role: 'user', content: message, time: new Date() }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/fleet/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context: 'fleet' })
      })
      if (res.ok) {
        const json = await res.json()
        setMessages(prev => [...prev, { role: 'assistant', content: json.data?.response || 'I analyzed your request but couldn\'t find specific data. Please ensure there is data in the system.', time: new Date() }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'I\'m currently processing your fleet data. Please try again in a moment.', time: new Date() }])
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error processing your request. Please check the system connection and try again.', time: new Date() }])
    } finally {
      setLoading(false)
      setTimeout(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }) }, 100)
    }
  }

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">AI Assistant</h2><p className="text-sm text-muted-foreground">Natural language fleet analytics and predictive insights</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Quick Queries</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {suggestions.map((s, i) => (
                <Button key={i} variant="outline" className="w-full justify-start text-xs h-auto py-2" onClick={() => handleSend(s.query)}>
                  <s.icon className="h-3.5 w-3.5 mr-2 shrink-0" />{s.label}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">AI Capabilities</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" />Fleet utilization analysis</div>
              <div className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" />Predictive maintenance alerts</div>
              <div className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" />Smart pricing recommendations</div>
              <div className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" />Revenue trend forecasting</div>
              <div className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-primary" />Executive report generation</div>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Bot className="h-5 w-5 text-primary" />FleetFlow AI</CardTitle></CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 h-[500px] pr-4">
              <div className="space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <p>{m.content}</p>
                      <p className={`text-[10px] mt-1 ${m.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                        {m.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} /><div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} /><div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} /></div>
                        <span className="text-muted-foreground">Analyzing fleet data...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Input
                placeholder="Ask about your fleet..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                className="flex-1 h-10"
                disabled={loading}
              />
              <Button onClick={() => handleSend()} disabled={loading || !input.trim()} className="h-10 px-4">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
