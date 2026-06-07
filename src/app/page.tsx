'use client'

import React, { useEffect, useCallback, useMemo, useState } from 'react'
import { useAppStore, navigationGroups } from '@/lib/store'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, Building2, CreditCard, Key, Monitor, Server, TrendingUp, RefreshCw,
  Car, BarChart3, ClipboardCheck, CalendarDays, FileText, ArrowLeftRight, Wallet, AlertTriangle,
  Users, IdCard, Radio, Route, MapPin, Fuel, Wrench, Settings, History, Cog, Package, Warehouse,
  Receipt, MinusCircle, DollarSign, BookOpen, Shield, FileCheck, UserCog, Clock, Palmtree, Banknote, Award, FolderOpen,
  PieChart, Bot, Search, Bell, Sun, Moon, Menu, ChevronLeft, X, Zap, Activity, Eye, LogOut,
  PanelLeftClose, PanelLeft, Sparkles, Command
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Auth pages
import LoginPage from '@/components/auth/LoginPage'
import DeviceActivationPage from '@/components/auth/DeviceActivationPage'

// Dynamic icon mapping
const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard, Building2, CreditCard, Key, Monitor, Server, TrendingUp, RefreshCw,
  Car, BarChart3, ClipboardCheck, CalendarDays, FileText, ArrowLeftRight, Wallet, AlertTriangle,
  Users, IdCard, Radio, Route, MapPin, Fuel, Wrench, Settings, History, Cog, Package, Warehouse,
  Receipt, MinusCircle, DollarSign, BookOpen, Shield, FileCheck, UserCog, Clock, Palmtree, Banknote, Award, FolderOpen,
  PieChart, Bot,
}

// Page content components
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

// ============================================
// macOS Tahoe — Liquid Glass Sidebar
// ============================================

function Sidebar() {
  const { activePage, setActivePage, sidebarCollapsed, setSidebarCollapsed, user, isDemo } = useAppStore()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [collapsedHover, setCollapsedHover] = useState(false)

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 68 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onMouseEnter={() => sidebarCollapsed && setCollapsedHover(true)}
      onMouseLeave={() => setCollapsedHover(false)}
      className={cn(
        "hidden md:flex flex-col h-full relative z-20 shrink-0",
        "glass-sidebar",
      )}
    >
      {/* Ambient glow behind sidebar */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-10 w-32 h-32 bg-chart-2/5 rounded-full blur-3xl" />
      </div>

      {/* Logo Area */}
      <div className="relative flex items-center gap-3 px-4 h-14 shrink-0">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground font-bold text-sm shrink-0 tahoe-glow cursor-pointer"
          onClick={() => setActivePage('dashboard' as any)}
        >
          FF
        </motion.div>
        <AnimatePresence>
          {(!sidebarCollapsed || collapsedHover) && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <p className="font-semibold text-sm">FleetFlow OS</p>
              <p className="text-[10px] text-muted-foreground -mt-0.5">Enterprise ERP</p>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            "ml-auto h-7 w-7 rounded-lg flex items-center justify-center transition-colors shrink-0",
            "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          {sidebarCollapsed ? <PanelLeft className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </motion.button>
      </div>

      {/* Demo Pill */}
      {isDemo && (!sidebarCollapsed || collapsedHover) && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-3 mt-1 mb-2"
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary/8 border border-primary/15">
            <Eye className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-semibold text-primary">DEMO</span>
            <span className="text-[10px] text-muted-foreground">View Only</span>
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <ScrollArea className="flex-1 py-1">
        <nav className="space-y-0.5 px-2">
          {navigationGroups.map((group, groupIdx) => (
            <div key={group.label} className={cn("mb-1", groupIdx > 0 && "mt-3")}>
              <AnimatePresence>
                {(!sidebarCollapsed || collapsedHover) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-2 mb-0.5"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                      {group.label}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              {group.items.map((item) => {
                const Icon = iconMap[item.icon] || LayoutDashboard
                const isActive = activePage === item.id
                const isHovered = hoveredItem === item.id
                return (
                  <TooltipProvider key={item.id} delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          onClick={() => setActivePage(item.id as any)}
                          onMouseEnter={() => setHoveredItem(item.id)}
                          onMouseLeave={() => setHoveredItem(null)}
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.97 }}
                          className={cn(
                            "relative flex items-center gap-2.5 w-full rounded-xl px-2.5 py-[7px] text-[13px] transition-all duration-200",
                            isActive
                              ? "text-primary font-semibold"
                              : "text-foreground/60 hover:text-foreground",
                            (sidebarCollapsed && !collapsedHover) && "justify-center px-0 rounded-xl"
                          )}
                        >
                          {/* Active background pill */}
                          {isActive && (
                            <motion.div
                              layoutId="sidebar-active"
                              className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/15"
                              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            />
                          )}
                          {/* Hover background */}
                          {!isActive && isHovered && (
                            <motion.div
                              layoutId="sidebar-hover"
                              className="absolute inset-0 rounded-xl bg-accent"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.15 }}
                            />
                          )}
                          <Icon className={cn(
                            "h-[18px] w-[18px] shrink-0 relative z-10 transition-colors",
                            isActive ? "text-primary" : "text-foreground/40"
                          )} />
                          <AnimatePresence>
                            {(!sidebarCollapsed || collapsedHover) && (
                              <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="truncate relative z-10"
                              >
                                {item.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                          {(!sidebarCollapsed || collapsedHover) && item.badge && (
                            <span className="ml-auto relative z-10 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary px-1">
                              {item.badge}
                            </span>
                          )}
                        </motion.button>
                      </TooltipTrigger>
                      {(sidebarCollapsed && !collapsedHover) && (
                        <TooltipContent side="right" sideOffset={8} className="text-xs font-medium glass-pill rounded-lg px-3 py-1.5">
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

      {/* User Section — Glass Card */}
      <div className="relative p-2 shrink-0">
        {user && (
          <div className={cn(
            "flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all",
            "bg-accent/50 hover:bg-accent"
          )}>
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-bold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <AnimatePresence>
              {(!sidebarCollapsed || collapsedHover) && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex flex-col min-w-0 overflow-hidden"
                >
                  <span className="text-xs font-medium truncate">{user.name}</span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {isDemo ? 'Demo Account' : user.role.replace(/_/g, ' ')}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.aside>
  )
}

// ============================================
// macOS Tahoe — Mobile Sidebar
// ============================================

function MobileSidebar() {
  const { activePage, setActivePage, sidebarOpen, setSidebarOpen, isDemo, user } = useAppStore()

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 md:hidden"
          >
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-[280px] glass-sidebar flex flex-col z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 h-14 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground font-bold text-sm tahoe-glow">
                    FF
                  </div>
                  <span className="font-semibold text-sm">FleetFlow OS</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              {isDemo && (
                <div className="mx-3 mb-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary/8 border border-primary/15">
                    <Eye className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-semibold text-primary">DEMO</span>
                    <span className="text-[10px] text-muted-foreground">View Only</span>
                  </div>
                </div>
              )}

              <ScrollArea className="flex-1 py-1">
                <nav className="space-y-0.5 px-2">
                  {navigationGroups.map((group, groupIdx) => (
                    <div key={group.label} className={cn("mb-1", groupIdx > 0 && "mt-3")}>
                      <div className="px-2 mb-0.5">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                          {group.label}
                        </span>
                      </div>
                      {group.items.map((item) => {
                        const Icon = iconMap[item.icon] || LayoutDashboard
                        const isActive = activePage === item.id
                        return (
                          <motion.button
                            key={item.id}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setActivePage(item.id as any)
                              setSidebarOpen(false)
                            }}
                            className={cn(
                              "relative flex items-center gap-2.5 w-full rounded-xl px-2.5 py-[7px] text-[13px] transition-all",
                              isActive
                                ? "text-primary font-semibold"
                                : "text-foreground/60 hover:text-foreground"
                            )}
                          >
                            {isActive && (
                              <div className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/15" />
                            )}
                            <Icon className={cn("h-[18px] w-[18px] shrink-0 relative z-10", isActive ? "text-primary" : "text-foreground/40")} />
                            <span className="truncate relative z-10">{item.label}</span>
                          </motion.button>
                        )
                      })}
                    </div>
                  ))}
                </nav>
              </ScrollArea>

              {user && (
                <div className="p-2 shrink-0">
                  <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-accent/50">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium truncate">{user.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {isDemo ? 'Demo Account' : user.role.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.aside>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============================================
// macOS Tahoe — Floating Toolbar
// ============================================

function Header() {
  const { activePage, setActivePage, setSidebarOpen, commandOpen, setCommandOpen, notifications, dismissNotification, user, isDemo, logout, sessionToken } = useAppStore()
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

  const handleLogout = useCallback(async () => {
    try {
      if (sessionToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        })
      }
    } catch {}
    logout()
    toast.success('Signed out successfully')
  }, [sessionToken, logout])

  return (
    <header className="h-12 glass-toolbar flex items-center justify-between px-3 gap-3 shrink-0 z-10">
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="md:hidden h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-[18px] w-[18px]" />
        </motion.button>
        <span className="text-[13px] font-semibold">{pageTitle}</span>
        {isDemo && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/8 text-[10px] font-semibold text-primary border border-primary/15">
            <Eye className="h-2.5 w-2.5" /> VIEW ONLY
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* Search Pill */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCommandOpen(true)}
          className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-full glass-pill text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search</span>
          <kbd className="flex items-center gap-0.5 rounded-md bg-background/50 px-1.5 h-5 text-[10px] font-medium text-muted-foreground">
            <span>⌘</span>K
          </kbd>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="sm:hidden h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          onClick={() => setCommandOpen(true)}
        >
          <Search className="h-4 w-4" />
        </motion.button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </motion.button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 glass-card rounded-2xl retina-shadow-lg" align="end">
            <div className="p-3 border-b border-border/50">
              <h4 className="font-semibold text-sm">Notifications</h4>
            </div>
            <ScrollArea className="h-64">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>
              ) : (
                <div className="p-1.5">
                  {notifications.slice(0, 10).map((n) => (
                    <div key={n.id} className="flex items-start gap-2 p-2.5 rounded-xl hover:bg-accent text-sm transition-colors">
                      <div className={cn(
                        "mt-0.5 h-2 w-2 rounded-full shrink-0",
                        n.type === 'success' && "bg-chart-4",
                        n.type === 'warning' && "bg-chart-2",
                        n.type === 'error' && "bg-destructive",
                        n.type === 'info' && "bg-primary",
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs">{n.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{n.message}</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="h-4 w-4 shrink-0 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground"
                        onClick={() => dismissNotification(n.id)}
                      >
                        <X className="h-2.5 w-2.5" />
                      </motion.button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </motion.button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 h-8 px-2 rounded-xl hover:bg-accent transition-colors"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-bold">
                  {user?.name.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden lg:inline text-[13px] font-medium">{user?.name}</span>
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-card rounded-2xl retina-shadow-lg">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
                {isDemo && (
                  <span className="flex items-center gap-1 w-fit mt-1 px-2 py-0.5 rounded-full bg-primary/8 text-[10px] font-semibold text-primary border border-primary/15">
                    <Eye className="h-2.5 w-2.5" /> Demo
                  </span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setActivePage('settings')} className="rounded-lg">
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive rounded-lg">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </DropdownMenuItem>
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

// ============================================
// macOS Tahoe — Minimal Footer
// ============================================

function Footer() {
  const { isDemo } = useAppStore()
  return (
    <footer className="h-7 glass-toolbar flex items-center justify-between px-4 text-[10px] text-muted-foreground shrink-0">
      <div className="flex items-center gap-2">
        <span className="font-medium">FleetFlow OS</span>
        <span className="text-muted-foreground/40">v1.0.0</span>
        {isDemo && (
          <span className="px-1.5 py-0.5 rounded-full bg-primary/8 text-[8px] font-semibold text-primary">DEMO</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-chart-4 animate-pulse" />
          Online
        </span>
      </div>
    </footer>
  )
}

// ============================================
// Main App Entry
// ============================================

export default function Home() {
  const { isAuthenticated, deviceActivated, isDemo } = useAppStore()
  const activePage = useAppStore((s) => s.activePage)
  const [sessionChecked, setSessionChecked] = useState(() => false)
  const [seedDone, setSeedDone] = useState(() => false)

  useEffect(() => {
    if (seedDone) return
    const seedData = async () => {
      try {
        await fetch('/api/auth/seed', { method: 'POST' })
      } catch {}
      setSeedDone(true)
      setSessionChecked(true)
    }
    seedData()
  }, [seedDone])

  useEffect(() => {
    if (!isAuthenticated || !sessionChecked) return
    const validateSession = async () => {
      const token = useAppStore.getState().sessionToken
      if (!token) return
      try {
        const res = await fetch('/api/auth/session', {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (!res.ok) {
          useAppStore.getState().logout()
        }
      } catch {}
    }
    validateSession()
    const interval = setInterval(validateSession, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [isAuthenticated, sessionChecked])

  // Loading splash
  if (!sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-xl tahoe-glow"
          >
            FF
          </motion.div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 animate-spin" />
            <span>Loading FleetFlow OS</span>
          </div>
        </motion.div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  if (!deviceActivated) {
    return <DeviceActivationPage />
  }

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
