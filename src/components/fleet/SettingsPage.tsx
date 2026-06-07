'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction } from 'lucide-react'

export default function SettingsPage() {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">SettingsPage</CardTitle></CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Construction className="h-10 w-10 mb-3" />
        <p className="text-sm font-medium">SettingsPage</p>
        <p className="text-xs">Module under development</p>
      </CardContent>
    </Card>
  )
}
