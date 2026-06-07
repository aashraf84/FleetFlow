import { db } from '../src/lib/db'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
function genKey(): string {
  const seg = () => Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
  return `FF-${seg()}-${seg()}-${seg()}`
}

async function seed() {
  console.log('Seeding database...')

  // Create tenants
  const tenants = await Promise.all([
    db.tenant.create({ data: { name: 'FleetFlow Global', domain: 'fleetflow.global', status: 'active', activeUsers: 45, storageUsed: 256, storageLimit: 1024, modulesEnabled: 'fleet,rental,customer,driver,fuel,maintenance,finance,hr,transport,insurance,compliance' } }),
    db.tenant.create({ data: { name: 'Al Rajhi Transport', domain: 'alrajhi.fleetflow.os', status: 'active', activeUsers: 28, storageUsed: 180, storageLimit: 512, modulesEnabled: 'fleet,rental,customer,driver,fuel,maintenance,transport' } }),
    db.tenant.create({ data: { name: 'Gulf Vehicle Rentals', domain: 'gulfrental.fleetflow.os', status: 'active', activeUsers: 15, storageUsed: 120, storageLimit: 512, modulesEnabled: 'fleet,rental,customer,driver,maintenance' } }),
    db.tenant.create({ data: { name: 'Desert Logistics Co', domain: 'desertlog.fleetflow.os', status: 'suspended', activeUsers: 0, storageUsed: 90, storageLimit: 256, modulesEnabled: 'fleet,transport,driver,fuel' } }),
    db.tenant.create({ data: { name: 'Metro Fleet Services', domain: 'metrofleet.fleetflow.os', status: 'active', activeUsers: 32, storageUsed: 310, storageLimit: 1024, modulesEnabled: 'fleet,rental,customer,driver,fuel,maintenance,finance' } }),
  ])

  // Create clients
  const clients = await Promise.all([
    db.client.create({ data: { companyName: 'Al Maktoum Holdings', contactPerson: 'Ahmed Al Maktoum', email: 'ahmed@almaktoum.ae', phone: '+971-4-234-5678', country: 'UAE', industryType: 'Logistics', subscriptionPlan: 'enterprise', licenseStatus: 'active', status: 'active', tenantId: tenants[0].id } }),
    db.client.create({ data: { companyName: 'Saudi Transport Group', contactPerson: 'Mohammed Al-Saud', email: 'msaud@sauditransport.sa', phone: '+966-11-234-5678', country: 'Saudi Arabia', industryType: 'Transport', subscriptionPlan: 'annual', licenseStatus: 'active', status: 'active', tenantId: tenants[1].id } }),
    db.client.create({ data: { companyName: 'Qatar Vehicle Services', contactPerson: 'Khalifa Al-Thani', email: 'khalifa@qvs.qa', phone: '+974-4411-2233', country: 'Qatar', industryType: 'Car Rental', subscriptionPlan: 'monthly', licenseStatus: 'active', status: 'active', tenantId: tenants[2].id } }),
    db.client.create({ data: { companyName: 'Bahrain Fleet Solutions', contactPerson: 'Fatima Al-Khalifa', email: 'fatima@bfs.bh', phone: '+973-1750-1234', country: 'Bahrain', industryType: 'Fleet Management', subscriptionPlan: 'monthly', licenseStatus: 'expired', status: 'suspended', tenantId: tenants[3].id } }),
    db.client.create({ data: { companyName: 'Kuwait Logistics Corp', contactPerson: 'Nasser Al-Sabah', email: 'nasser@klc.kw', phone: '+965-2244-3322', country: 'Kuwait', industryType: 'Logistics', subscriptionPlan: 'annual', licenseStatus: 'active', status: 'active', tenantId: tenants[4].id } }),
    db.client.create({ data: { companyName: 'Oman Transport LLC', contactPerson: 'Sultan Al-Busaidi', email: 'sultan@otl.om', phone: '+968-2456-7890', country: 'Oman', industryType: 'Transport', subscriptionPlan: 'trial', licenseStatus: 'trial', status: 'active', tenantId: tenants[0].id } }),
    db.client.create({ data: { companyName: 'Dubai Rent-a-Car', contactPerson: 'Rashid Al-Maktoum', email: 'rashid@dubairent.ae', phone: '+971-4-345-6789', country: 'UAE', industryType: 'Car Rental', subscriptionPlan: 'enterprise', licenseStatus: 'active', status: 'active', tenantId: tenants[0].id } }),
    db.client.create({ data: { companyName: 'Abu Dhabi Fleet Co', contactPerson: 'Zayed Al-Nahyan', email: 'zayed@adfc.ae', phone: '+971-2-456-7890', country: 'UAE', industryType: 'Government', subscriptionPlan: 'enterprise', licenseStatus: 'active', status: 'active', tenantId: tenants[0].id } }),
  ])

  // Create subscriptions
  const now = new Date()
  for (const client of clients) {
    const planMap: Record<string, { price: number, months: number }> = {
      trial: { price: 0, months: 1 },
      monthly: { price: 299, months: 1 },
      annual: { price: 2999, months: 12 },
      enterprise: { price: 9999, months: 12 },
    }
    const plan = planMap[client.subscriptionPlan] || planMap.trial
    const start = new Date(now)
    start.setMonth(start.getMonth() - Math.floor(Math.random() * 6))
    const expiry = new Date(start)
    expiry.setMonth(expiry.getMonth() + plan.months)

    await db.subscription.create({
      data: {
        clientId: client.id,
        planType: client.subscriptionPlan,
        startDate: start,
        expiryDate: expiry,
        autoRenewal: client.subscriptionPlan !== 'trial',
        activeModules: client.subscriptionPlan === 'enterprise' ? 'fleet,rental,customer,driver,fuel,maintenance,finance,hr,transport' : 'fleet,rental,customer,driver',
        userLimit: client.subscriptionPlan === 'enterprise' ? 50 : client.subscriptionPlan === 'annual' ? 20 : 5,
        storageLimit: client.subscriptionPlan === 'enterprise' ? 2048 : client.subscriptionPlan === 'annual' ? 1024 : 512,
        price: plan.price,
        status: client.status === 'suspended' ? 'suspended' : (expiry < now ? 'expired' : 'active'),
      }
    })
  }

  // Create licenses
  for (const client of clients) {
    const status = client.licenseStatus === 'expired' ? 'expired' : client.licenseStatus === 'trial' ? 'trial' : 'active'
    await db.license.create({
      data: {
        clientId: client.id,
        licenseKey: genKey(),
        activationDate: status !== 'trial' ? new Date(now.getTime() - 90 * 86400000) : null,
        expiryDate: status !== 'trial' ? new Date(now.getTime() + 275 * 86400000) : null,
        status,
        maxDevices: client.subscriptionPlan === 'enterprise' ? 10 : 3,
      }
    })
  }

  // Create devices
  const browsers = ['Chrome 120', 'Firefox 121', 'Safari 17', 'Edge 120', 'Chrome Mobile']
  const osList = ['Windows 11', 'macOS 14', 'Ubuntu 22.04', 'iOS 17', 'Android 14']
  const locations = ['Dubai, UAE', 'Riyadh, Saudi Arabia', 'Doha, Qatar', 'Manama, Bahrain', 'Kuwait City, Kuwait', 'Muscat, Oman', 'Abu Dhabi, UAE']

  for (let i = 0; i < 20; i++) {
    const status = i < 14 ? 'approved' : i < 17 ? 'pending' : 'blocked'
    await db.device.create({
      data: {
        deviceName: `${browsers[i % 5]} on ${osList[i % 5]}`,
        browser: browsers[i % 5],
        os: osList[i % 5],
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        lastLogin: new Date(now.getTime() - Math.floor(Math.random() * 7 * 86400000)),
        location: locations[i % locations.length],
        status,
      }
    })
  }

  // Create vehicles
  const makes = ['Toyota', 'Nissan', 'Hyundai', 'Kia', 'Ford', 'Chevrolet', 'Mercedes', 'BMW']
  const models = ['Camry', 'Altima', 'Sonata', 'Optima', 'Explorer', 'Tahoe', 'C-Class', 'X5']
  const categories = ['sedan', 'suv', 'truck', 'bus', 'van', 'luxury']
  const statuses = ['available', 'reserved', 'rented', 'maintenance', 'in_service']

  for (let i = 0; i < 50; i++) {
    const cat = categories[i % categories.length]
    const status = statuses[i % statuses.length]
    const make = makes[i % makes.length]
    const model = models[i % models.length]
    await db.vehicle.create({
      data: {
        vehicleNumber: `VH-${String(i + 1).padStart(4, '0')}`,
        registrationNumber: `REG-${String(i + 1001).padStart(4, '0')}`,
        vin: `VIN${String(i).padStart(14, '0')}X`,
        make,
        model,
        year: 2020 + (i % 5),
        category: cat,
        fuelType: ['petrol', 'diesel', 'electric', 'hybrid'][i % 4],
        transmission: i % 3 === 0 ? 'manual' : 'automatic',
        seatingCapacity: cat === 'bus' ? 45 : cat === 'van' ? 12 : 5,
        mileage: Math.floor(Math.random() * 150000),
        currentLocation: locations[i % locations.length],
        status,
        dailyRate: cat === 'luxury' ? 450 : cat === 'suv' ? 250 : cat === 'bus' ? 600 : cat === 'truck' ? 350 : 120,
        weeklyRate: cat === 'luxury' ? 2800 : cat === 'suv' ? 1500 : cat === 'bus' ? 3800 : 720,
        monthlyRate: cat === 'luxury' ? 9500 : cat === 'suv' ? 5200 : cat === 'bus' ? 14000 : 2800,
        purchasePrice: cat === 'luxury' ? 65000 : cat === 'bus' ? 85000 : cat === 'truck' ? 55000 : 28000,
        currentValue: cat === 'luxury' ? 45000 : cat === 'bus' ? 55000 : cat === 'truck' ? 35000 : 15000,
        tenantId: tenants[i % 5].id,
      }
    })
  }

  // Create customers
  const firstNames = ['Ahmed', 'Mohammed', 'Khalid', 'Sultan', 'Rashid', 'Fatima', 'Noor', 'Layla', 'Omar', 'Hassan', 'Ali', 'Yusuf']
  const lastNames = ['Al-Maktoum', 'Al-Saud', 'Al-Thani', 'Al-Khalifa', 'Al-Sabah', 'Al-Busaidi', 'Al-Nahyan', 'Al-Rashid', 'Al-Fahad', 'Al-Sulaiman']

  for (let i = 0; i < 30; i++) {
    await db.customer.create({
      data: {
        firstName: firstNames[i % firstNames.length],
        lastName: lastNames[i % lastNames.length],
        email: `customer${i + 1}@example.com`,
        phone: `+971-50-${String(1000000 + i).slice(-7)}`,
        city: locations[i % locations.length].split(',')[0],
        country: locations[i % locations.length].split(', ')[1] || 'UAE',
        status: i % 15 === 0 ? 'inactive' : 'active',
        creditRating: ['excellent', 'good', 'fair', 'poor'][i % 4],
        tenantId: tenants[i % 5].id,
      }
    })
  }

  // Create drivers
  for (let i = 0; i < 20; i++) {
    await db.driver.create({
      data: {
        firstName: firstNames[i % firstNames.length],
        lastName: lastNames[i % lastNames.length],
        phone: `+971-55-${String(2000000 + i).slice(-7)}`,
        licenseNumber: `DL-${String(i + 5001).padStart(5, '0')}`,
        licenseClass: ['A', 'B', 'C', 'D'][i % 4],
        licenseExpiry: new Date(now.getTime() + (180 + Math.floor(Math.random() * 365)) * 86400000),
        status: i % 10 === 0 ? 'inactive' : 'active',
        rating: 3.5 + Math.random() * 1.5,
        drivingHours: Math.floor(Math.random() * 5000),
        baseSalary: 3000 + Math.floor(Math.random() * 2000),
        tenantId: tenants[i % 5].id,
      }
    })
  }

  // Create reservations
  const allCustomers = await db.customer.findMany({ take: 15 })
  const allVehicles = await db.vehicle.findMany({ take: 20 })

  for (let i = 0; i < 25; i++) {
    const customer = allCustomers[i % allCustomers.length]
    const vehicle = allVehicles[i % allVehicles.length]
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30))
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 1 + Math.floor(Math.random() * 14))

    await db.reservation.create({
      data: {
        reservationCode: `RES-${String(i + 1001).padStart(5, '0')}`,
        customerId: customer.id,
        vehicleId: vehicle.id,
        startDate,
        endDate,
        dailyRate: vehicle.dailyRate,
        totalAmount: vehicle.dailyRate * Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000),
        depositAmount: 500,
        status: ['pending', 'confirmed', 'active', 'completed', 'cancelled'][i % 5],
      }
    })
  }

  // Create fuel records
  for (let i = 0; i < 40; i++) {
    const vehicle = allVehicles[i % allVehicles.length]
    await db.fuelRecord.create({
      data: {
        vehicleId: vehicle.id,
        fuelType: vehicle.fuelType || 'petrol',
        quantity: 20 + Math.floor(Math.random() * 60),
        costPerUnit: 2.5 + Math.random() * 1.5,
        totalCost: 50 + Math.random() * 200,
        mileageAtFill: vehicle.mileage + Math.floor(Math.random() * 1000),
        vendor: ['ADNOC', 'Aramco', 'QP Fuel', 'Shell', 'Total'][i % 5],
        date: new Date(now.getTime() - Math.floor(Math.random() * 30) * 86400000),
      }
    })
  }

  // Create maintenance records
  const maintCategories = ['oil_change', 'tire_replacement', 'inspection', 'service', 'repair', 'brake']
  for (let i = 0; i < 20; i++) {
    const vehicle = allVehicles[i % allVehicles.length]
    await db.maintenanceRecord.create({
      data: {
        vehicleId: vehicle.id,
        type: i % 3 === 0 ? 'corrective' : 'preventive',
        category: maintCategories[i % maintCategories.length],
        description: `${maintCategories[i % maintCategories.length].replace('_', ' ')} for ${vehicle.make} ${vehicle.model}`,
        scheduledDate: new Date(now.getTime() + Math.floor(Math.random() * 14) * 86400000),
        cost: 100 + Math.floor(Math.random() * 2000),
        vendor: ['AutoPro', 'QuickFit', 'Al-Futtaim Motors', 'Emirates Motor', 'Gargash'][i % 5],
        status: ['scheduled', 'in_progress', 'completed'][i % 3],
        nextDueDate: new Date(now.getTime() + (30 + Math.floor(Math.random() * 180)) * 86400000),
      }
    })
  }

  // Create revenue records
  const revenueCategories = ['sales', 'subscription', 'renewal', 'other']
  for (let i = 0; i < 60; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - Math.floor(Math.random() * 180))
    await db.revenue.create({
      data: {
        category: revenueCategories[i % 4],
        amount: 500 + Math.floor(Math.random() * 15000),
        clientId: clients[i % clients.length].id,
        description: `${revenueCategories[i % 4]} revenue - ${date.toLocaleDateString()}`,
        date,
      }
    })
  }

  // Create update records
  const versions = ['1.0.0', '1.1.0', '1.2.0', '2.0.0', '2.1.0', '2.2.0']
  const types = ['major', 'minor', 'patch', 'critical']
  for (let i = 0; i < 6; i++) {
    const pubDate = new Date(now)
    pubDate.setDate(pubDate.getDate() - (6 - i) * 30)
    await db.updateRecord.create({
      data: {
        version: versions[i],
        releaseNotes: i === 5
          ? 'Major platform overhaul with new fleet analytics engine, improved GPS tracking, enhanced driver management, and multi-currency support.'
          : i === 4
          ? 'New subscription management module, improved license key generation, enhanced device tracking, and performance optimizations.'
          : i === 3
          ? 'Complete UI redesign, new revenue analytics dashboard, tenant management improvements, and critical security patches.'
          : i === 2
          ? 'Added preventive maintenance scheduling, fuel management improvements, and enhanced reporting capabilities.'
          : i === 1
          ? 'New rental operations module, contract management enhancements, and deposit tracking system.'
          : 'Initial release with core fleet management, vehicle registry, and basic rental functionality.',
        type: types[i % types.length],
        isCritical: i === 3,
        forceUpdate: i === 3,
        status: i < 5 ? 'published' : 'draft',
        publishedAt: i < 5 ? pubDate : null,
      }
    })
  }

  // Create expenses
  const expenseCategories = ['maintenance', 'fuel', 'payroll', 'insurance', 'permits', 'office']
  for (let i = 0; i < 30; i++) {
    await db.expense.create({
      data: {
        category: expenseCategories[i % expenseCategories.length],
        amount: 200 + Math.floor(Math.random() * 5000),
        description: `${expenseCategories[i % expenseCategories.length]} expense`,
        vendor: ['Vendor A', 'Vendor B', 'Vendor C', 'Vendor D'][i % 4],
        date: new Date(now.getTime() - Math.floor(Math.random() * 60) * 86400000),
        status: ['pending', 'approved', 'paid'][i % 3],
        tenantId: tenants[i % 5].id,
      }
    })
  }

  // Create client activities
  for (const client of clients) {
    const actions = ['Logged in', 'Updated profile', 'Created reservation', 'Viewed reports', 'Exported data', 'Changed settings']
    for (let i = 0; i < 3; i++) {
      await db.clientActivity.create({
        data: {
          clientId: client.id,
          action: actions[i % actions.length],
          details: `Activity performed by ${client.contactPerson}`,
        }
      })
    }
  }

  console.log('Seeding completed successfully!')
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect())
