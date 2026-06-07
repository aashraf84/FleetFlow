import { PrismaClient } from '@prisma/client'

// ============================================
// Multi-Tenant Database Manager
// ============================================
// Each registered Client gets their own separate PostgreSQL database.
// This manager creates, caches, and routes to tenant-specific PrismaClient instances.
//
// Architecture:
//   Central DB (neondb): Users, Sessions, Tenants, Clients, Subscriptions, Licenses, Devices
//   Tenant DB (ff_<slug>): Vehicles, Customers, Drivers, Reservations, Contracts, Invoices, etc.
//
// When a new Client registers:
//   1. A new Neon database `ff_<slug>` is created
//   2. The tenant schema is migrated to the new database
//   3. The Tenant record is updated with dbName + dbReady=true
//   4. All tenant-specific queries route through getTenantDb(slug)
// ============================================

const tenantClients = new Map<string, PrismaClient>()

/**
 * Get the Neon pooler URL template and construct a tenant-specific connection string
 */
function getTenantDbUrl(dbName: string): string {
  const template = process.env.TENANT_DB_URL_TEMPLATE
  if (!template) {
    throw new Error('TENANT_DB_URL_TEMPLATE is not configured in .env')
  }
  return template.replace('{dbname}', dbName)
}

/**
 * Get or create a PrismaClient for a specific tenant database.
 * Clients are cached for the lifetime of the process.
 */
export function getTenantDb(tenantSlug: string): PrismaClient {
  const cacheKey = tenantSlug.toLowerCase()
  
  if (tenantClients.has(cacheKey)) {
    return tenantClients.get(cacheKey)!
  }

  // Derive the database name from the tenant slug
  const dbName = `ff_${cacheKey.replace(/[^a-z0-9]/g, '_')}`
  const dbUrl = getTenantDbUrl(dbName)

  const client = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  tenantClients.set(cacheKey, client)
  return client
}

/**
 * Get a PrismaClient for a tenant by their explicit database name.
 * Used when the Tenant record has the dbName stored.
 */
export function getTenantDbByName(dbName: string): PrismaClient {
  if (tenantClients.has(dbName)) {
    return tenantClients.get(dbName)!
  }

  const dbUrl = getTenantDbUrl(dbName)

  const client = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  tenantClients.set(dbName, client)
  return client
}

/**
 * Create a new tenant database on Neon.
 * Uses the direct (non-pooler) connection to run CREATE DATABASE.
 * Then runs the tenant schema migration via prisma db push.
 */
export async function provisionTenantDatabase(slug: string): Promise<{ success: boolean; dbName: string; error?: string }> {
  const dbName = `ff_${slug.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
  
  try {
    // Step 1: Create the database using the direct connection
    const directUrl = process.env.DATABASE_URL_DIRECT
    if (!directUrl) {
      throw new Error('DATABASE_URL_DIRECT is not configured')
    }

    // Use fetch to call Neon SQL API or use pg directly
    // For Neon, we'll use a direct PostgreSQL connection to create the database
    const { execSync } = await import('child_process')
    
    // Create database via psql command
    const createDbCmd = `psql "${directUrl}" -c "CREATE DATABASE \\"${dbName}\\""`
    
    try {
      execSync(createDbCmd, { timeout: 30000, stdio: 'pipe' })
    } catch (err: any) {
      // Database might already exist
      if (!err?.message?.includes('already exists')) {
        throw err
      }
    }

    // Step 2: Run prisma db push against the new tenant database
    const tenantDbUrl = getTenantDbUrl(dbName)
    const tenantSchemaPath = 'prisma/schema-tenant.prisma'
    
    // Set env variable temporarily and run prisma db push
    const pushCmd = `DATABASE_URL="${tenantDbUrl}" TENANT_DATABASE_URL="${tenantDbUrl}" npx prisma db push --schema=${tenantSchemaPath} --skip-generate`
    execSync(pushCmd, { 
      timeout: 60000, 
      stdio: 'pipe',
      cwd: process.cwd(),
    })

    return { success: true, dbName }
  } catch (error: any) {
    console.error(`Failed to provision tenant database ${dbName}:`, error.message)
    return { success: false, dbName, error: error.message }
  }
}

/**
 * Disconnect and remove a tenant's PrismaClient from cache.
 * Useful for cleanup or when a tenant database is deprovisioned.
 */
export async function disconnectTenantDb(slugOrDbName: string): Promise<void> {
  const client = tenantClients.get(slugOrDbName)
  if (client) {
    await client.$disconnect()
    tenantClients.delete(slugOrDbName)
  }
}

/**
 * Disconnect all tenant database connections.
 * Call on app shutdown.
 */
export async function disconnectAllTenantDbs(): Promise<void> {
  const promises = Array.from(tenantClients.values()).map(client => client.$disconnect())
  await Promise.all(promises)
  tenantClients.clear()
}

/**
 * Get list of all currently cached tenant connections.
 */
export function getActiveTenantConnections(): string[] {
  return Array.from(tenantClients.keys())
}
