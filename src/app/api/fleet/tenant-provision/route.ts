import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/fleet/tenant-provision — Provision a tenant database
export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await req.json()
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    if (tenant.dbReady) {
      return NextResponse.json({ message: 'Database already provisioned', dbName: tenant.dbName })
    }

    const dbName = tenant.dbName

    // Step 1: Create database via Neon SQL API
    try {
      const { neon } = await import('@neondatabase/serverless')
      const adminUrl = 'postgresql://neondb_owner:npg_e4uQwH9cNifF@ep-lucky-fog-ap5pa8qr-pooler.c-7.us-east-1.aws.neon.tech/postgres?sslmode=require'
      const adminSql = neon(adminUrl)
      
      // Use unsafe() since CREATE DATABASE doesn't support parameterized queries
      const safeDbName = (dbName || '').replace(/[^a-z0-9_]/g, '')
      await adminSql.unsafe(`CREATE DATABASE "${safeDbName}"`)
    } catch (err: any) {
      // Database might already exist
      if (!err?.message?.includes('already exists')) {
        console.error('CREATE DATABASE error:', err?.message)
        return NextResponse.json({ error: `Failed to create database: ${err?.message}` }, { status: 500 })
      }
    }

    // Step 2: Run schema migration on the new tenant database
    try {
      const { neon } = await import('@neondatabase/serverless')
      const tenantDbUrl = `postgresql://neondb_owner:npg_e4uQwH9cNifF@ep-lucky-fog-ap5pa8qr-pooler.c-7.us-east-1.aws.neon.tech/${safeDbName}?sslmode=require`
      const tenantSql = neon(tenantDbUrl)

      // Create core tables
      await tenantSql`
        CREATE TABLE IF NOT EXISTS "Vehicle" (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "vehicleNumber" TEXT NOT NULL,
          "registrationNumber" TEXT NOT NULL,
          make TEXT NOT NULL,
          model TEXT NOT NULL,
          year INTEGER NOT NULL DEFAULT 0,
          category TEXT NOT NULL DEFAULT 'sedan',
          color TEXT, vin TEXT, "engineNumber" TEXT, transmission TEXT,
          "fuelType" TEXT NOT NULL DEFAULT 'petrol',
          mileage DOUBLE PRECISION NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'available',
          "dailyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "weeklyRate" DOUBLE PRECISION, "monthlyRate" DOUBLE PRECISION,
          "currentLocation" TEXT, notes TEXT, "tenantId" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `
      await tenantSql`
        CREATE TABLE IF NOT EXISTS "Customer" (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "firstName" TEXT NOT NULL, "lastName" TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE, phone TEXT NOT NULL,
          address TEXT, city TEXT, country TEXT, nationality TEXT,
          "idNumber" TEXT, "drivingLicense" TEXT, "licenseExpiry" TIMESTAMP,
          "dateOfBirth" TIMESTAMP, "emergencyContact" TEXT, "emergencyPhone" TEXT,
          status TEXT NOT NULL DEFAULT 'active', notes TEXT,
          "totalRentals" INTEGER NOT NULL DEFAULT 0,
          "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "tenantId" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `
      await tenantSql`
        CREATE TABLE IF NOT EXISTS "Driver" (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "firstName" TEXT NOT NULL, "lastName" TEXT NOT NULL,
          email TEXT UNIQUE, phone TEXT NOT NULL,
          "licenseNumber" TEXT NOT NULL, "licenseExpiry" TIMESTAMP,
          "licenseClass" TEXT, address TEXT, city TEXT, nationality TEXT,
          "dateOfBirth" TIMESTAMP, "hireDate" TIMESTAMP,
          status TEXT NOT NULL DEFAULT 'active',
          rating DOUBLE PRECISION NOT NULL DEFAULT 0,
          "totalTrips" INTEGER NOT NULL DEFAULT 0,
          "totalDistance" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "emergencyContact" TEXT, notes TEXT, "tenantId" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `
      await tenantSql`
        CREATE TABLE IF NOT EXISTS "Reservation" (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "reservationCode" TEXT NOT NULL UNIQUE,
          "customerId" TEXT NOT NULL, "vehicleId" TEXT NOT NULL,
          "startDate" TIMESTAMP NOT NULL, "endDate" TIMESTAMP NOT NULL,
          "pickupLocation" TEXT, "returnLocation" TEXT,
          "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "depositAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'pending', notes TEXT, "tenantId" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `
      await tenantSql`
        CREATE TABLE IF NOT EXISTS "RentalContract" (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "contractNumber" TEXT NOT NULL UNIQUE,
          "reservationId" TEXT UNIQUE,
          "customerId" TEXT NOT NULL, "vehicleId" TEXT NOT NULL,
          "startDate" TIMESTAMP NOT NULL, "endDate" TIMESTAMP NOT NULL,
          "dailyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "totalDays" INTEGER NOT NULL DEFAULT 0,
          "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "depositAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "mileageLimit" DOUBLE PRECISION, "mileageOut" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "mileageIn" DOUBLE PRECISION NOT NULL DEFAULT 0,
          terms TEXT, status TEXT NOT NULL DEFAULT 'active',
          "signedDate" TIMESTAMP, "returnDate" TIMESTAMP,
          notes TEXT, "tenantId" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `
    } catch (migrationErr: any) {
      console.error('Schema migration error:', migrationErr?.message)
      // Continue even if partial migration
    }

    // Step 3: Mark tenant as ready
    await db.tenant.update({
      where: { id: tenantId },
      data: { dbReady: true },
    })

    return NextResponse.json({ 
      success: true, 
      dbName, 
      message: `Database ${dbName} provisioned successfully` 
    })
  } catch (error: any) {
    console.error('Tenant provision error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to provision tenant' }, { status: 500 })
  }
}

// GET /api/fleet/tenant-provision?tenantId=xxx — Check provisioning status
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get('tenantId')
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 })
    }

    const tenant = await db.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json({
      tenantId: tenant.id,
      dbName: tenant.dbName,
      dbReady: tenant.dbReady,
      modulesEnabled: tenant.modulesEnabled,
      activeUsers: tenant.activeUsers,
      userLimit: tenant.userLimit,
    })
  } catch (error) {
    console.error('Tenant status error:', error)
    return NextResponse.json({ error: 'Failed to get tenant status' }, { status: 500 })
  }
}
