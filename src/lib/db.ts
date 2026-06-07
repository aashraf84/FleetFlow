// Ensure DATABASE_URL is set for Prisma at runtime
// This is needed because Next.js Turbopack may cache env variables
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')) {
  process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_e4uQwH9cNifF@ep-lucky-fog-ap5pa8qr-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
}

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Central platform database — stores auth, tenants, clients, subscriptions, licenses
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
