import { create } from 'zustand'

export type PageId = 
  | 'dashboard'
  | 'owner-clients' | 'owner-subscriptions' | 'owner-licenses' | 'owner-devices' 
  | 'owner-tenants' | 'owner-revenue' | 'owner-updates'
  | 'fleet-vehicles' | 'fleet-tracking' | 'fleet-inspections'
  | 'rental-reservations' | 'rental-contracts' | 'rental-operations' 
  | 'rental-deposits' | 'rental-damage'
  | 'customers' | 'drivers'
  | 'transport-dispatch' | 'transport-trips' | 'gps-tracking'
  | 'fuel-management'
  | 'maintenance-preventive' | 'maintenance-corrective' | 'maintenance-history'
  | 'workshop' | 'spare-parts' | 'inventory'
  | 'finance-invoices' | 'finance-expenses' | 'finance-payments' | 'finance-accounting'
  | 'insurance' | 'compliance'
  | 'hr-employees' | 'hr-attendance' | 'hr-leave' | 'hr-payroll' | 'hr-performance'
  | 'documents'
  | 'reports' | 'ai-assistant' | 'settings'

interface AppState {
  activePage: PageId
  setActivePage: (page: PageId) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  commandOpen: boolean
  setCommandOpen: (open: boolean) => void
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'time'>) => void
  dismissNotification: (id: string) => void
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  time: Date
  read: boolean
}

export const useAppStore = create<AppState>((set) => ({
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [{
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      time: new Date(),
      read: false,
    }, ...state.notifications].slice(0, 50)
  })),
  dismissNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
}))

// Navigation structure
export interface NavItem {
  id: PageId
  label: string
  icon: string
  badge?: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export function usePageTitle(): string {
  const activePage = useAppStore((s) => s.activePage)
  for (const group of navigationGroups) {
    const item = group.items.find(i => i.id === activePage)
    if (item) return item.label
  }
  return 'Dashboard'
}

export const navigationGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    ],
  },
  {
    label: 'Owner Management',
    items: [
      { id: 'owner-clients', label: 'Clients', icon: 'Building2' },
      { id: 'owner-subscriptions', label: 'Subscriptions', icon: 'CreditCard' },
      { id: 'owner-licenses', label: 'Licenses', icon: 'Key' },
      { id: 'owner-devices', label: 'Devices', icon: 'Monitor' },
      { id: 'owner-tenants', label: 'Tenants', icon: 'Server' },
      { id: 'owner-revenue', label: 'Revenue', icon: 'TrendingUp' },
      { id: 'owner-updates', label: 'Updates', icon: 'RefreshCw' },
    ],
  },
  {
    label: 'Fleet Management',
    items: [
      { id: 'fleet-vehicles', label: 'Vehicle Registry', icon: 'Car' },
      { id: 'fleet-tracking', label: 'Fleet Tracking', icon: 'BarChart3' },
      { id: 'fleet-inspections', label: 'Inspections', icon: 'ClipboardCheck' },
    ],
  },
  {
    label: 'Rental Management',
    items: [
      { id: 'rental-reservations', label: 'Reservations', icon: 'CalendarDays' },
      { id: 'rental-contracts', label: 'Contracts', icon: 'FileText' },
      { id: 'rental-operations', label: 'Operations', icon: 'ArrowLeftRight' },
      { id: 'rental-deposits', label: 'Deposits', icon: 'Wallet' },
      { id: 'rental-damage', label: 'Damage Mgmt', icon: 'AlertTriangle' },
    ],
  },
  {
    label: 'People',
    items: [
      { id: 'customers', label: 'Customers', icon: 'Users' },
      { id: 'drivers', label: 'Drivers', icon: 'IdCard' },
    ],
  },
  {
    label: 'Transport & GPS',
    items: [
      { id: 'transport-dispatch', label: 'Dispatch Center', icon: 'Radio' },
      { id: 'transport-trips', label: 'Trip Management', icon: 'Route' },
      { id: 'gps-tracking', label: 'GPS Tracking', icon: 'MapPin' },
    ],
  },
  {
    label: 'Fuel & Maintenance',
    items: [
      { id: 'fuel-management', label: 'Fuel Management', icon: 'Fuel' },
      { id: 'maintenance-preventive', label: 'Preventive Maint.', icon: 'Wrench' },
      { id: 'maintenance-corrective', label: 'Corrective Maint.', icon: 'Settings' },
      { id: 'maintenance-history', label: 'Maint. History', icon: 'History' },
      { id: 'workshop', label: 'Workshop', icon: 'Cog' },
      { id: 'spare-parts', label: 'Spare Parts', icon: 'Package' },
      { id: 'inventory', label: 'Inventory', icon: 'Warehouse' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'finance-invoices', label: 'Invoices', icon: 'Receipt' },
      { id: 'finance-expenses', label: 'Expenses', icon: 'MinusCircle' },
      { id: 'finance-payments', label: 'Payments', icon: 'DollarSign' },
      { id: 'finance-accounting', label: 'Accounting', icon: 'BookOpen' },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { id: 'insurance', label: 'Insurance', icon: 'Shield' },
      { id: 'compliance', label: 'Compliance', icon: 'FileCheck' },
    ],
  },
  {
    label: 'HR & Documents',
    items: [
      { id: 'hr-employees', label: 'Employees', icon: 'UserCog' },
      { id: 'hr-attendance', label: 'Attendance', icon: 'Clock' },
      { id: 'hr-leave', label: 'Leave Mgmt', icon: 'Palmtree' },
      { id: 'hr-payroll', label: 'Payroll', icon: 'Banknote' },
      { id: 'hr-performance', label: 'Performance', icon: 'Award' },
      { id: 'documents', label: 'Documents', icon: 'FolderOpen' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { id: 'reports', label: 'Reports & Analytics', icon: 'PieChart' },
      { id: 'ai-assistant', label: 'AI Assistant', icon: 'Bot' },
      { id: 'settings', label: 'Settings', icon: 'Settings' },
    ],
  },
]
