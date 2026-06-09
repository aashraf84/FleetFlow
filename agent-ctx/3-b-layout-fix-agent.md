# Task 3-b — Fix Layout Bugs in Transport, Maintenance, and Workshop Pages

## Agent
Main Agent

## Task
Fix 8 Transport, Maintenance, and Workshop module pages with standardized layout patterns.

## Changes Applied to All 8 Files

### 1. Stat Cards — Upgraded to rich cards with icons, dark mode, hover
- Added `icon`, `color` (text-xxx-600), `bg` (bg-xxx-50 dark:bg-xxx-950/30) to each stat definition
- Card markup: `hover:shadow-md transition-shadow`, icon badge with `p-1.5 rounded-md`, `text-2xl font-bold` value
- Color palette: slate (totals), amber (pending/open), cyan (in progress/dispatched), emerald/green (completed/cost)

### 2. Stat Grid — Capped at 4 columns
- `md:grid-cols-5` → `md:grid-cols-4` (TransportDispatchPage, WorkshopPage)
- Already `md:grid-cols-4` in other files (no change needed)

### 3. Table Responsive — Column hiding
- `hidden md:table-cell` on medium-priority columns (Driver, Category, Description, etc.)
- `hidden lg:table-cell` on low-priority columns (Scheduled, Cost, Vendor, etc.)
- Key columns always visible: Name/ID, Status, Actions

### 4. Dialog Sizing
- Simple forms (2-6 fields): `max-w-4xl` → `max-w-2xl` (Workshop create/edit, SpareParts adjust, Inventory adjust/transfer)
- Complex forms (7+ fields with sections): Kept `max-w-4xl` (all dispatch/trip/maintenance forms)

### 5. ScrollArea — Standardized
- All changed to `max-h-[440px]` (from 500px or 400px)

### 6. Page Header — Card+CardHeader pattern
- Wrapped title+description+action button in `<Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">`
- Uses `CardTitle` and `CardDescription` components

## Files Modified
1. `/src/components/fleet/TransportDispatchPage.tsx`
2. `/src/components/fleet/TransportTripsPage.tsx`
3. `/src/components/fleet/MaintenancePreventivePage.tsx`
4. `/src/components/fleet/MaintenanceCorrectivePage.tsx`
5. `/src/components/fleet/MaintenanceHistoryPage.tsx`
6. `/src/components/fleet/WorkshopPage.tsx`
7. `/src/components/fleet/SparePartsPage.tsx`
8. `/src/components/fleet/InventoryPage.tsx`

## Verification
- Lint: passed with zero errors
- Dev server: running without compilation errors
- Work log: appended to `/home/z/my-project/worklog.md`
