'use client'
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Settings, Bell, Shield, Palette, Database, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState({
    companyName: 'FleetFlow OS',
    language: 'en',
    timezone: 'UTC',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    emailNotifications: true,
    pushNotifications: false,
    maintenanceAlerts: true,
    complianceReminders: true,
    twoFactorAuth: false,
    sessionTimeout: '30',
    maxDevices: 3,
  })

  const handleSave = () => {
    toast.success('Settings saved successfully')
  }

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Settings</h2><p className="text-sm text-muted-foreground">Configure your FleetFlow OS preferences</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4" />General Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label className="text-xs">Company Name</Label><Input value={settings.companyName} onChange={e => setSettings({...settings, companyName: e.target.value})} className="h-9 mt-1" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">Language</Label><Select value={settings.language} onValueChange={v => setSettings({...settings, language: v})}><SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="ar">Arabic</SelectItem><SelectItem value="fr">French</SelectItem><SelectItem value="es">Spanish</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs">Timezone</Label><Select value={settings.timezone} onValueChange={v => setSettings({...settings, timezone: v})}><SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="UTC">UTC</SelectItem><SelectItem value="EST">EST</SelectItem><SelectItem value="PST">PST</SelectItem><SelectItem value="Asia/Karachi">Asia/Karachi</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs">Currency</Label><Select value={settings.currency} onValueChange={v => setSettings({...settings, currency: v})}><SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="EUR">EUR (€)</SelectItem><SelectItem value="GBP">GBP (£)</SelectItem><SelectItem value="AED">AED (د.إ)</SelectItem><SelectItem value="SAR">SAR (﷼)</SelectItem></SelectContent></Select></div>
                <div><Label className="text-xs">Date Format</Label><Select value={settings.dateFormat} onValueChange={v => setSettings({...settings, dateFormat: v})}><SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem><SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem><SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem></SelectContent></Select></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" />Appearance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Dark Mode</p><p className="text-xs text-muted-foreground">Switch between light and dark theme</p></div>
                <Switch checked={theme === 'dark'} onCheckedChange={checked => setTheme(checked ? 'dark' : 'light')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" />Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Email Notifications</p><p className="text-xs text-muted-foreground">Receive alerts via email</p></div><Switch checked={settings.emailNotifications} onCheckedChange={v => setSettings({...settings, emailNotifications: v})} /></div>
              <Separator />
              <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Push Notifications</p><p className="text-xs text-muted-foreground">Browser push notifications</p></div><Switch checked={settings.pushNotifications} onCheckedChange={v => setSettings({...settings, pushNotifications: v})} /></div>
              <Separator />
              <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Maintenance Alerts</p><p className="text-xs text-muted-foreground">Get notified about upcoming maintenance</p></div><Switch checked={settings.maintenanceAlerts} onCheckedChange={v => setSettings({...settings, maintenanceAlerts: v})} /></div>
              <Separator />
              <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Compliance Reminders</p><p className="text-xs text-muted-foreground">Reminders for expiring documents</p></div><Switch checked={settings.complianceReminders} onCheckedChange={v => setSettings({...settings, complianceReminders: v})} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />Security</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><div><p className="text-sm font-medium">Two-Factor Authentication</p><p className="text-xs text-muted-foreground">Add extra security to your account</p></div><Switch checked={settings.twoFactorAuth} onCheckedChange={v => setSettings({...settings, twoFactorAuth: v})} /></div>
              <div><Label className="text-xs">Session Timeout (minutes)</Label><Input type="number" value={settings.sessionTimeout} onChange={e => setSettings({...settings, sessionTimeout: e.target.value})} className="h-9 mt-1 w-32" /></div>
              <div><Label className="text-xs">Maximum Allowed Devices</Label><Input type="number" value={settings.maxDevices} onChange={e => setSettings({...settings, maxDevices: parseInt(e.target.value)})} className="h-9 mt-1 w-32" /></div>
            </CardContent>
          </Card>

          <Button onClick={handleSave}>Save Settings</Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">System Information</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Version</span><span className="font-medium">1.0.0</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">License</span><span className="font-medium">Enterprise</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Database</span><span className="font-medium">SQLite</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Server Status</span><Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Online</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Last Backup</span><span className="font-medium">Today</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Active Modules</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {['Fleet Management', 'Rental Management', 'Customer Management', 'Driver Management', 'Fuel Management', 'Maintenance', 'Workshop', 'Finance', 'HR', 'Insurance', 'Compliance', 'AI Assistant', 'Reports', 'Documents'].map(m => (
                <div key={m} className="flex items-center justify-between text-xs">
                  <span>{m}</span>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[9px]">Active</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
