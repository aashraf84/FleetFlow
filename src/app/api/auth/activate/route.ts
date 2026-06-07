import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { serialKey, deviceFingerprint, deviceName, browser, os } = await req.json()

    if (!serialKey || !deviceFingerprint) {
      return NextResponse.json({ error: 'Serial key and device info are required' }, { status: 400 })
    }

    // Find the license with this serial key
    const license = await db.license.findUnique({
      where: { licenseKey: serialKey }
    })

    if (!license) {
      return NextResponse.json({ error: 'Invalid serial key. Please check and try again.' }, { status: 404 })
    }

    if (license.status === 'expired' || license.status === 'suspended') {
      return NextResponse.json({ 
        error: `This license is ${license.status}. Please contact support.` 
      }, { status: 403 })
    }

    // Check if license has expired by date
    if (license.expiryDate && new Date() > license.expiryDate) {
      await db.license.update({
        where: { id: license.id },
        data: { status: 'expired' }
      })
      return NextResponse.json({ error: 'This license has expired. Please renew your subscription.' }, { status: 403 })
    }

    // Check device count - count devices registered under this license
    const registeredDevices = await db.device.count()
    if (registeredDevices >= license.maxDevices) {
      return NextResponse.json({ 
        error: `Maximum device limit reached (${license.maxDevices}). Please deactivate a device or upgrade your license.` 
      }, { status: 403 })
    }

    // Register or update the device
    await db.device.upsert({
      where: { id: deviceFingerprint },
      update: {
        deviceName: deviceName || 'Unknown Device',
        browser: browser || null,
        os: os || null,
        status: 'approved',
        lastLogin: new Date(),
      },
      create: {
        id: deviceFingerprint,
        deviceName: deviceName || 'Unknown Device',
        browser: browser || null,
        os: os || null,
        status: 'approved',
        lastLogin: new Date(),
      }
    })

    // Update license activation date and status
    if (!license.activationDate) {
      await db.license.update({
        where: { id: license.id },
        data: { activationDate: new Date(), status: 'active' }
      })
    } else if (license.status === 'trial') {
      await db.license.update({
        where: { id: license.id },
        data: { status: 'active' }
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Device activated successfully!',
      license: {
        id: license.id,
        status: 'active',
        expiryDate: license.expiryDate,
        maxDevices: license.maxDevices,
      }
    })
  } catch (error) {
    console.error('Activation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
