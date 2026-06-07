// FleetFlow Central Database — Neon PostgreSQL (Multi-Tenant)
// Central DB: Auth, Tenants, Clients, Subscriptions, Licenses, Devices
// Tenant DBs: Vehicles, Customers, Drivers, Reservations, Contracts, etc.

// Ensure DATABASE_URL is set for Prisma at runtime
// Turbopack may not properly propagate .env to Prisma's datasource validation
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
  process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_e4uQwH9cNifF@ep-lucky-fog-ap5pa8qr-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
}
if (!process.env.DATABASE_URL_DIRECT) {
  process.env.DATABASE_URL_DIRECT = 'postgresql://neondb_owner:npg_e4uQwH9cNifF@ep-lucky-fog-ap5pa8qr.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require'
}

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
