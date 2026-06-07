// FleetFlow Central Database — Neon PostgreSQL
// Prisma Client for WRITE operations only (limited TCP connections)
// Import from '@/lib/sql' for READ operations instead

const NEON_URL = 'postgresql://neondb_owner:npg_e4uQwH9cNifF@ep-lucky-fog-ap5pa8qr-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require'
const POOLER_URL = 'postgresql://neondb_owner:npg_e4uQwH9cNifF@ep-lucky-fog-ap5pa8qr-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&connection_limit=3&pool_timeout=30&connect_timeout=10'

process.env.DATABASE_URL = NEON_URL

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
        url: POOLER_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
