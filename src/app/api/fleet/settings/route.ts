import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

// ============================================
// Fleet Settings API Route
// ============================================
// Manages tenant-specific settings across 9 categories:
//   general, receipt, invoice, payment, tax, email, notification, security, appearance
//
// Session resolution:
//   1. Extract Bearer token from Authorization header
//   2. Look up session in central DB (db.session.findUnique)
//   3. Resolve user -> tenantId
//   4. Use tenantId for all settings queries
//
// Fallback for demo/no-tenant users:
//   Returns default settings without DB persistence
// ============================================

// --------------- Valid categories ---------------
const VALID_CATEGORIES = [
  'general',
  'receipt',
  'invoice',
  'payment',
  'tax',
  'email',
  'notification',
  'security',
  'appearance',
] as const

type SettingCategory = (typeof VALID_CATEGORIES)[number]

// --------------- Default settings per category ---------------
const DEFAULT_SETTINGS: Record<SettingCategory, Record<string, unknown>> = {
  general: {
    companyName: 'FleetFlow OS',
    companyLogo: '',
    language: 'en',
    timezone: 'UTC',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    fiscalYearStart: '01',
    weekStartsOn: 'monday',
    phone: '',
    email: '',
    address: '',
    website: '',
    taxId: '',
    registrationNumber: '',
  },
  receipt: {
    prefix: 'RCT',
    nextNumber: 1,
    numberingFormat: 'prefix-sequential', // prefix-sequential | prefix-year-sequential | prefix-date-sequential
    autoPrint: false,
    showTaxes: true,
    showCustomerDetails: true,
    showPaymentMethod: true,
    showVehicleDetails: true,
    showDriverDetails: false,
    showCompanyLogo: true,
    paperSize: 'A4', // A4 | Letter | Thermal-80mm | Thermal-58mm
    footerText: 'Thank you for your business!',
    headerText: '',
    showBarcode: false,
    showQRCode: false,
    duplicateReceipt: false,
  },
  invoice: {
    prefix: 'INV',
    nextNumber: 1,
    numberingFormat: 'prefix-sequential',
    paymentTerms: 'net_30', // due_on_receipt | net_15 | net_30 | net_45 | net_60 | net_90
    dueDays: 30,
    autoGenerate: true,
    autoSend: false,
    showCompanyLogo: true,
    showTaxes: true,
    showDiscount: true,
    showPaymentDetails: true,
    showBankDetails: false,
    paperSize: 'A4',
    headerText: '',
    footerText: '',
    notes: '',
    termsAndConditions:
      'Payment is due within 30 days of invoice date. Late payments may be subject to a fee.',
    bankName: '',
    bankAccount: '',
    bankIban: '',
    bankSwift: '',
  },
  payment: {
    acceptedMethods: ['cash', 'card', 'bank_transfer', 'check'],
    autoReceipt: true,
    lateFeeEnabled: false,
    lateFeeType: 'percentage', // percentage | fixed
    lateFeeValue: 0,
    lateFeeGraceDays: 0,
    depositPercentage: 10,
    depositRequired: true,
    partialPayments: true,
    roundOff: false,
    currencySymbol: '$',
    decimalPlaces: 2,
  },
  tax: {
    enabled: true,
    taxInclusive: false, // prices include tax?
    defaultTaxRate: 0,
    taxName: 'VAT',
    taxId: '',
    taxRates: [],
    showTaxIdOnInvoice: true,
    compoundTax: false,
  },
  email: {
    provider: 'smtp', // smtp | sendgrid | mailgun
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpEncryption: 'tls', // tls | ssl | none
    fromName: 'FleetFlow OS',
    fromEmail: '',
    replyTo: '',
    templateHeader: '',
    templateFooter: '',
  },
  notification: {
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    maintenanceAlerts: true,
    complianceReminders: true,
    rentalAlerts: true,
    paymentAlerts: true,
    overdueAlerts: true,
    dailyDigest: false,
    weeklyReport: true,
    alertDaysBefore: 7,
  },
  security: {
    twoFactorAuth: false,
    sessionTimeout: 30,
    maxDevices: 3,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: false,
    loginAttempts: 5,
    lockoutDuration: 30,
    ipWhitelist: '',
  },
  appearance: {
    theme: 'system', // system | light | dark
    primaryColor: '#0d9488',
    sidebarStyle: 'solid', // solid | transparent
    compactMode: false,
    showAvatar: true,
    animationEnabled: true,
  },
}

// --------------- Session resolution ---------------
interface ResolvedSession {
  userId: string
  tenantId: string | null
  tenantSlug: string | null
  role: string
  isDemo: boolean
}

async function resolveSession(req: NextRequest): Promise<{
  session: ResolvedSession | null
  error: NextResponse | null
}> {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '').trim()

  if (!token) {
    return {
      session: null,
      error: NextResponse.json({ error: 'Authorization required' }, { status: 401 }),
    }
  }

  try {
    const session = await db.session.findUnique({
      where: { token },
      include: { user: { include: { tenant: true } } },
    })

    if (!session) {
      return {
        session: null,
        error: NextResponse.json({ error: 'Invalid session' }, { status: 401 }),
      }
    }

    // Check expiry
    if (new Date() > session.expiresAt) {
      await db.session.delete({ where: { id: session.id } }).catch(() => {})
      return {
        session: null,
        error: NextResponse.json({ error: 'Session expired' }, { status: 401 }),
      }
    }

    return {
      session: {
        userId: session.user.id,
        tenantId: session.user.tenantId,
        tenantSlug: session.user.tenant?.slug ?? null,
        role: session.user.role,
        isDemo: session.user.role === 'demo',
      },
      error: null,
    }
  } catch (err) {
    console.error('[Settings] Session resolution error:', err)
    return {
      session: null,
      error: NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
    }
  }
}

// --------------- Deep merge helper ---------------
function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: Record<string, unknown>
): T {
  const result = { ...base } as Record<string, unknown>
  for (const key of Object.keys(override)) {
    if (
      typeof override[key] === 'object' &&
      override[key] !== null &&
      !Array.isArray(override[key]) &&
      typeof base[key] === 'object' &&
      base[key] !== null &&
      !Array.isArray(base[key])
    ) {
      result[key] = deepMerge(
        base[key] as Record<string, unknown>,
        override[key] as Record<string, unknown>
      )
    } else {
      result[key] = override[key]
    }
  }
  return result as T
}

// --------------- GET: Fetch settings ---------------
// GET /api/fleet/settings              → all settings grouped by category
// GET /api/fleet/settings?category=inv → single category settings
export async function GET(req: NextRequest) {
  const { session, error } = await resolveSession(req)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')

  // Validate category if provided
  if (category && !VALID_CATEGORIES.includes(category as SettingCategory)) {
    return NextResponse.json(
      {
        error: `Invalid category "${category}". Valid categories: ${VALID_CATEGORIES.join(', ')}`,
      },
      { status: 400 }
    )
  }

  const tenantId = session!.tenantId

  // If no tenant, return defaults (demo mode without tenant association)
  if (!tenantId) {
    if (category) {
      return NextResponse.json({
        data: DEFAULT_SETTINGS[category as SettingCategory],
        category,
        source: 'default',
      })
    }
    return NextResponse.json({
      data: DEFAULT_SETTINGS,
      source: 'default',
    })
  }

  try {
    // Fetch stored settings from central DB for this tenant
    const whereClause: Prisma.TenantSettingsWhereInput = { tenantId }
    if (category) {
      whereClause.category = category
    }

    const storedSettings = await db.tenantSettings.findMany({ where: whereClause })

    // Build a map of stored settings by category
    const storedMap = new Map<string, Record<string, unknown>>()
    for (const row of storedSettings) {
      storedMap.set(row.category, row.data as Record<string, unknown>)
    }

    if (category) {
      // Return single category, merging defaults with stored values
      const defaults = DEFAULT_SETTINGS[category as SettingCategory]
      const stored = storedMap.get(category)
      const merged = stored ? deepMerge(defaults, stored) : defaults

      return NextResponse.json({
        data: merged,
        category,
        source: stored ? 'database' : 'default',
      })
    }

    // Return all categories, merging defaults with stored values
    const allSettings: Record<string, Record<string, unknown>> = {}
    for (const cat of VALID_CATEGORIES) {
      const defaults = DEFAULT_SETTINGS[cat]
      const stored = storedMap.get(cat)
      allSettings[cat] = stored ? deepMerge(defaults, stored) : defaults
    }

    return NextResponse.json({
      data: allSettings,
      categories: VALID_CATEGORIES,
      source: storedSettings.length > 0 ? 'database' : 'default',
    })
  } catch (err) {
    console.error('[Settings] GET error:', err)

    // Graceful fallback to defaults on DB error
    if (category) {
      return NextResponse.json({
        data: DEFAULT_SETTINGS[category as SettingCategory],
        category,
        source: 'default',
        warning: 'Database unavailable, returning defaults',
      })
    }
    return NextResponse.json({
      data: DEFAULT_SETTINGS,
      source: 'default',
      warning: 'Database unavailable, returning defaults',
    })
  }
}

// --------------- PUT: Update settings for a category ---------------
// Body: { category: string, data: object }
// Upserts the TenantSettings record
export async function PUT(req: NextRequest) {
  const { session, error } = await resolveSession(req)
  if (error) return error

  let body: { category?: string; data?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { category, data } = body

  // Validate required fields
  if (!category) {
    return NextResponse.json(
      { error: 'Missing required field: category' },
      { status: 400 }
    )
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return NextResponse.json(
      { error: 'Missing or invalid required field: data (must be an object)' },
      { status: 400 }
    )
  }

  // Validate category
  if (!VALID_CATEGORIES.includes(category as SettingCategory)) {
    return NextResponse.json(
      {
        error: `Invalid category "${category}". Valid categories: ${VALID_CATEGORIES.join(', ')}`,
      },
      { status: 400 }
    )
  }

  const tenantId = session!.tenantId

  // No tenant — demo mode: accept but don't persist
  if (!tenantId) {
    // Merge with defaults for the response
    const defaults = DEFAULT_SETTINGS[category as SettingCategory]
    const merged = deepMerge(defaults, data)

    return NextResponse.json({
      data: merged,
      category,
      source: 'ephemeral',
      message: 'Settings accepted but not persisted (no tenant association)',
    })
  }

  try {
    // Deep-merge the incoming data with existing stored data (not defaults),
    // so partial updates work correctly
    const existing = await db.tenantSettings.findUnique({
      where: {
        tenantId_category: { tenantId, category },
      },
    })

    const existingData = (existing?.data as Record<string, unknown>) ?? {}
    const mergedData = deepMerge(existingData, data)

    // Upsert: create if not exists, update if exists
    const upserted = await db.tenantSettings.upsert({
      where: {
        tenantId_category: { tenantId, category },
      },
      create: {
        tenantId,
        category,
        data: mergedData as Prisma.InputJsonValue,
      },
      update: {
        data: mergedData as Prisma.InputJsonValue,
      },
    })

    // Return the full merged settings (defaults + stored) for the category
    const defaults = DEFAULT_SETTINGS[category as SettingCategory]
    const responseData = deepMerge(defaults, upserted.data as Record<string, unknown>)

    return NextResponse.json({
      data: responseData,
      category,
      source: 'database',
    })
  } catch (err) {
    console.error('[Settings] PUT error:', err)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}

// --------------- POST: Initialize default settings ---------------
// Seeds all default settings categories for a tenant
// Optionally accepts { overwrite?: boolean } to force overwrite existing
export async function POST(req: NextRequest) {
  const { session, error } = await resolveSession(req)
  if (error) return error

  let options: { overwrite?: boolean } = {}
  try {
    const body = await req.json()
    if (body && typeof body === 'object') {
      options = body
    }
  } catch {
    // Empty body is fine — defaults to no overwrite
  }

  const tenantId = session!.tenantId

  if (!tenantId) {
    return NextResponse.json({
      initialized: VALID_CATEGORIES,
      source: 'default',
      message: 'Default settings prepared (no tenant association, not persisted)',
    })
  }

  try {
    const results: { category: string; action: 'created' | 'skipped' }[] = []

    for (const category of VALID_CATEGORIES) {
      const existing = await db.tenantSettings.findUnique({
        where: {
          tenantId_category: { tenantId, category },
        },
      })

      if (existing && !options.overwrite) {
        results.push({ category, action: 'skipped' })
        continue
      }

      if (existing && options.overwrite) {
        // Overwrite with defaults
        await db.tenantSettings.update({
          where: {
            tenantId_category: { tenantId, category },
          },
          data: {
            data: DEFAULT_SETTINGS[category] as Prisma.InputJsonValue,
          },
        })
        results.push({ category, action: 'created' })
      } else {
        // Create new
        await db.tenantSettings.create({
          data: {
            tenantId,
            category,
            data: DEFAULT_SETTINGS[category] as Prisma.InputJsonValue,
          },
        })
        results.push({ category, action: 'created' })
      }
    }

    const created = results.filter((r) => r.action === 'created').length
    const skipped = results.filter((r) => r.action === 'skipped').length

    return NextResponse.json({
      initialized: results,
      summary: {
        total: VALID_CATEGORIES.length,
        created,
        skipped,
      },
      message: `Initialized ${created} categories${skipped > 0 ? `, skipped ${skipped} existing (use { overwrite: true } to reset)` : ''}`,
    })
  } catch (err) {
    console.error('[Settings] POST (initialize) error:', err)
    return NextResponse.json(
      { error: 'Failed to initialize settings' },
      { status: 500 }
    )
  }
}

// --------------- DELETE: Reset a category to defaults ---------------
// Query param: category (required)
export async function DELETE(req: NextRequest) {
  const { session, error } = await resolveSession(req)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')

  if (!category) {
    return NextResponse.json(
      { error: 'Missing required query param: category' },
      { status: 400 }
    )
  }

  if (!VALID_CATEGORIES.includes(category as SettingCategory)) {
    return NextResponse.json(
      {
        error: `Invalid category "${category}". Valid categories: ${VALID_CATEGORIES.join(', ')}`,
      },
      { status: 400 }
    )
  }

  const tenantId = session!.tenantId

  if (!tenantId) {
    return NextResponse.json({
      data: DEFAULT_SETTINGS[category as SettingCategory],
      category,
      message: 'Reset to defaults (no tenant association)',
    })
  }

  try {
    const existing = await db.tenantSettings.findUnique({
      where: {
        tenantId_category: { tenantId, category },
      },
    })

    if (existing) {
      await db.tenantSettings.delete({
        where: {
          tenantId_category: { tenantId, category },
        },
      })
    }

    return NextResponse.json({
      data: DEFAULT_SETTINGS[category as SettingCategory],
      category,
      message: `Category "${category}" reset to defaults`,
    })
  } catch (err) {
    console.error('[Settings] DELETE error:', err)
    return NextResponse.json(
      { error: 'Failed to reset settings' },
      { status: 500 }
    )
  }
}
