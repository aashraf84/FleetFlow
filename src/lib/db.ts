// FleetFlow Central Database — Neon PostgreSQL (Multi-Tenant)
// Central DB: Auth, Tenants, Clients, Subscriptions, Licenses, Devices
// Tenant DBs: Vehicles, Customers, Drivers, Reservations, Contracts, etc.

// FORCE Neon PostgreSQL — override any stale SQLite/file: URL from the environment
// The container has a leftover file: URL that overrides .env, so we must force it.
const NEON_URL = 'postgresql://neondb_owner:npg_e4uQwH9cNifF@ep-lucky-fog-ap5pa8qr-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
const NEON_URL_DIRECT = 'postgresql://neondb_owner:npg_e4uQwH9cNifF@ep-lucky-fog-ap5pa8qr.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require'

process.env.DATABASE_URL = NEON_URL
process.env.DATABASE_URL_DIRECT = NEON_URL_DIRECT

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: NEON_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
