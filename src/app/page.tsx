'use client'

import React, { useEffect, useCallback, useMemo } from 'react'
import { useAppStore, usePageTitle, navigationGroups } from '@/lib/store'
import { useTheme } from 'next-themes'
import { 
  LayoutDashboard, Building2, CreditCard, Key, Monitor, Server, TrendingUp, RefreshCw,
  Car, BarChart3, ClipboardCheck, CalendarDays, FileText, ArrowLeftRight, Wallet, AlertTriangle,
  Users, IdCard, Radio, Route, MapPin, Fuel, Wrench, Settings, History, Cog, Package, Warehouse,
  Receipt, MinusCircle, DollarSign, BookOpen, Shield, FileCheck, UserCog, Clock, Palmtree, Banknote, Award, FolderOpen,
  PieChart, Bot, Search, Bell, Sun, Moon, Menu, ChevronLeft, X, Command, Home, Zap, Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Dynamic icon mapping
const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard, Building2, CreditCard, Key, Monitor, Server, TrendingUp, RefreshCw,
  Car, BarChart3, ClipboardCheck, CalendarDays, FileText, ArrowLeftRight, Wallet, AlertTriangle,
  Users, IdCard, Radio, Route, MapPin, Fuel, Wrench, Settings, History, Cog, Package, Warehouse,
  Receipt, MinusCircle, DollarSign, BookOpen, Shield, FileCheck, UserCog, Clock, Palmtree, Banknote, Award, FolderOpen,
  PieChart, Bot,
}

// Page Content Components
import DashboardPage from '@/components/fleet/DashboardPage'
import OwnerClientsPage from '@/components/fleet/OwnerClientsPage'
import OwnerSubscriptionsPage from '@/components/fleet/OwnerSubscriptionsPage'
import OwnerLicensesPage from '@/components/fleet/OwnerLicensesPage'
import OwnerDevicesPage from '@/components/fleet/OwnerDevicesPage'
import OwnerTenantsPage from '@/components/fleet/OwnerTenantsPage'
import OwnerRevenuePage from '@/components/fleet/OwnerRevenuePage'
import OwnerUpdatesPage from '@/components/fleet/OwnerUpdatesPage'
import FleetVehiclesPage from '@/components/fleet/FleetVehiclesPage'
import FleetTrackingPage from '@/components/fleet/FleetTrackingPage'
import FleetInspectionsPage from '@/components/fleet/FleetInspectionsPage'
import RentalReservationsPage from '@/components/fleet/RentalReservationsPage'
import RentalContractsPage from '@/components/fleet/RentalContractsPage'
import RentalOperationsPage from '@/components/fleet/RentalOperationsPage'
import RentalDepositsPage from '@/components/fleet/RentalDepositsPage'
import RentalDamagePage from '@/components/fleet/RentalDamagePage'
import CustomersPage from '@/components/fleet/CustomersPage'
import DriversPage from '@/components/fleet/DriversPage'
import TransportDispatchPage from '@/components/fleet/TransportDispatchPage'
import TransportTripsPage from '@/components/fleet/TransportTripsPage'
import GpsTrackingPage from '@/components/fleet/GpsTrackingPage'
import FuelManagementPage from '@/components/fleet/FuelManagementPage'
import MaintenancePreventivePage from '@/components/fleet/MaintenancePreventivePage'
import MaintenanceCorrectivePage from '@/components/fleet/MaintenanceCorrectivePage'
import MaintenanceHistoryPage from '@/components/fleet/MaintenanceHistoryPage'
import WorkshopPage from '@/components/fleet/WorkshopPage'
import SparePartsPage from '@/components/fleet/SparePartsPage'
import InventoryPage from '@/components/fleet/InventoryPage'
import FinanceInvoicesPage from '@/components/fleet/FinanceInvoicesPage'
import FinanceExpensesPage from '@/components/fleet/FinanceExpensesPage'
import FinancePaymentsPage from '@/components/fleet/FinancePaymentsPage'
import FinanceAccountingPage from '@/components/fleet/FinanceAccountingPage'
import InsurancePage from '@/components/fleet/InsurancePage'
import CompliancePage from '@/components/fleet/CompliancePage'
import HrEmployeesPage from '@/components/fleet/HrEmployeesPage'
import HrAttendancePage from '@/components/fleet/HrAttendancePage'
import HrLeavePage from '@/components/fleet/HrLeavePage'
import HrPayrollPage from '@/components/fleet/HrPayrollPage'
import HrPerformancePage from '@/components/fleet/HrPerformancePage'
import DocumentsPage from '@/components/fleet/DocumentsPage'
import ReportsPage from '@/components/fleet/ReportsPage'
import AiAssistantPage from '@/components/fleet/AiAssistantPage'
import SettingsPage from '@/components/fleet/SettingsPage'

const pageComponents: Record<string, React.ComponentType> = {
  'dashboard': DashboardPage,
  'owner-clients': OwnerClientsPage,
  'owner-subscriptions': OwnerSubscriptionsPage,
  'owner-licenses': OwnerLicensesPage,
  'owner-devices': OwnerDevicesPage,
  'owner-tenants': OwnerTenantsPage,
  'owner-revenue': OwnerRevenuePage,
  'owner-updates': OwnerUpdatesPage,
  'fleet-vehicles': FleetVehiclesPage,
  'fleet-tracking': FleetTrackingPage,
  'fleet-inspections': FleetInspectionsPage,
  'rental-reservations': RentalReservationsPage,
  'rental-contracts': RentalContractsPage,
  'rental-operations': RentalOperationsPage,
  'rental-deposits': RentalDepositsPage,
  'rental-damage': RentalDamagePage,
  'customers': CustomersPage,
  'drivers': DriversPage,
  'transport-dispatch': TransportDispatchPage,
  'transport-trips': TransportTripsPage,
  'gps-tracking': GpsTrackingPage,
  'fuel-management': FuelManagementPage,
  'maintenance-preventive': MaintenancePreventivePage,
  'maintenance-corrective': MaintenanceCorrectivePage,
  'maintenance-history': MaintenanceHistoryPage,
  'workshop': WorkshopPage,
  'spare-parts': SparePartsPage,
  'inventory': InventoryPage,
  'finance-invoices': FinanceInvoicesPage,
  'finance-expenses': FinanceExpensesPage,
  'finance-payments': FinancePaymentsPage,
  'finance-accounting': FinanceAccountingPage,
  'insurance': InsurancePage,
  'compliance': CompliancePage,
  'hr-employees': HrEmployeesPage,
  'hr-attendance': HrAttendancePage,
  'hr-leave': HrLeavePage,
  'hr-payroll': HrPayrollPage,
  'hr-performance': HrPerformancePage,
  'documents': DocumentsPage,
  'reports': ReportsPage,
  'ai-assistant': AiAssistantPage,
  'settings': SettingsPage,
}

function Sidebar() {
  const { activePage, setActivePage, sidebarCollapsed, setSidebarCollapsed } = useAppStore()

  return (
    <aside className={cn(
      "hidden md:flex flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 h-full",
      sidebarCollapsed ? "w-[60px]" : "w-[260px]"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16 border-b border-sidebar-border shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm shrink-0">
          FF
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm truncate">FleetFlow OS</span>
            <span className="text-[10px] text-sidebar-foreground/60 truncate">Enterprise Fleet Management</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-6 w-6 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform", sidebarCollapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-2">
        <nav className="space-y-1 px-2">
          {navigationGroups.map((group) => (
            <div key={group.label} className="mb-3">
              {!sidebarCollapsed && (
                <div className="px-2 mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                    {group.label}
                  </span>
                </div>
              )}
              {group.items.map((item) => {
                const Icon = iconMap[item.icon] || LayoutDashboard
                const isActive = activePage === item.id
                return (
                  <TooltipProvider key={item.id} delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActivePage(item.id as any)}
                          className={cn(
                            "flex items-center gap-2.5 w-full rounded-md px-2.5 py-1.5 text-sm transition-colors",
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                            sidebarCollapsed && "justify-center px-0"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                          {!sidebarCollapsed && item.badge && (
                            <Badge variant="secondary" className="ml-auto h-4 px-1 text-[10px]">
                              {item.badge}
                            </Badge>
                          )}
                        </button>
                      </TooltipTrigger>
                      {sidebarCollapsed && (
                        <TooltipContent side="right" className="font-medium text-xs">
                          {item.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom */}
      <div className="border-t border-sidebar-border p-3 shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-sidebar-accent/50">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
              A
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium truncate">Admin User</span>
              <span className="text-[10px] text-sidebar-foreground/50 truncate">Super Owner</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

function MobileSidebar() {
  const { activePage, setActivePage, sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-[280px] bg-sidebar text-sidebar-foreground flex flex-col z-50">
            <div className="flex items-center justify-between px-4 h-16 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm">
                  FF
                </div>
                <span className="font-bold text-sm">FleetFlow OS</span>
              </div>
              <Button variant="ghost" size="icon" className="text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1 py-2">
              <nav className="space-y-1 px-2">
                {navigationGroups.map((group) => (
                  <div key={group.label} className="mb-3">
                    <div className="px-2 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                        {group.label}
                      </span>
                    </div>
                    {group.items.map((item) => {
                      const Icon = iconMap[item.icon] || LayoutDashboard
                      const isActive = activePage === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActivePage(item.id as any)
                            setSidebarOpen(false)
                          }}
                          className={cn(
                            "flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </nav>
            </ScrollArea>
          </aside>
        </div>
      )}
    </>
  )
}

function Header() {
  const { activePage, setActivePage, setSidebarOpen, commandOpen, setCommandOpen, notifications, dismissNotification } = useAppStore()
  const { theme, setTheme } = useTheme()

  const pageTitle = useMemo(() => {
    for (const group of navigationGroups) {
      const item = group.items.find(i => i.id === activePage)
      if (item) return item.label
    }
    return 'Dashboard'
  }, [activePage])

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandOpen(!commandOpen)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [commandOpen, setCommandOpen])

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 gap-4 shrink-0">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSidebarOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Home className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm font-medium">{pageTitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2 h-8 w-64 text-muted-foreground"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        <Button variant="ghost" size="icon" className="sm:hidden h-8 w-8" onClick={() => setCommandOpen(true)}>
          <Search className="h-4 w-4" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-3 border-b">
              <h4 className="font-semibold text-sm">Notifications</h4>
            </div>
            <ScrollArea className="h-64">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
              ) : (
                <div className="p-2">
                  {notifications.slice(0, 10).map((n) => (
                    <div key={n.id} className="flex items-start gap-2 p-2 rounded-md hover:bg-accent text-sm">
                      <div className={cn(
                        "mt-0.5 h-2 w-2 rounded-full shrink-0",
                        n.type === 'success' && "bg-green-500",
                        n.type === 'warning' && "bg-amber-500",
                        n.type === 'error' && "bg-red-500",
                        n.type === 'info' && "bg-primary",
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs">{n.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => dismissNotification(n.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">A</AvatarFallback>
              </Avatar>
              <span className="hidden lg:inline text-sm font-medium">Admin</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Admin User</span>
                <span className="text-xs text-muted-foreground">admin@fleetflow.os</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setActivePage('settings')}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search pages, actions..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {navigationGroups.flatMap(g => g.items).map((item) => {
              const Icon = iconMap[item.icon] || LayoutDashboard
              return (
                <CommandItem
                  key={item.id}
                  value={item.label}
                  onSelect={() => {
                    setActivePage(item.id as any)
                    setCommandOpen(false)
                  }}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  )
}

function Footer() {
  return (
    <footer className="h-8 border-t bg-card flex items-center justify-between px-4 text-[10px] text-muted-foreground shrink-0">
      <span>FleetFlow OS v1.0.0</span>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-green-500" /> System Online</span>
        <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> All Services Running</span>
      </div>
    </footer>
  )
}

export default function Home() {
  const { activePage } = useAppStore()
  const ActiveComponent = pageComponents[activePage] || DashboardPage

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <MobileSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            <ActiveComponent />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  )
}
