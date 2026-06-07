'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction } from 'lucide-react'

export default function GpsTrackingPage() {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">GpsTrackingPage</CardTitle></CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Construction className="h-10 w-10 mb-3" />
        <p className="text-sm font-medium">GpsTrackingPage</p>
        <p className="text-xs">Module under development</p>
      </CardContent>
    </Card>
  )
}
