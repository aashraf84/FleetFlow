import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper: date offsets from now
const now = new Date()
const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000)
const daysFromNow = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000)
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000)
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000)

// Demo tenant ID constant
const TENANT_ID = 'demo-tenant-001'
const CLIENT_ID = 'demo-client-001'

// GET — Check if seed data exists
export async function GET() {
  try {
    const tenantCount = await db.tenant.count()
    if (tenantCount > 0) {
      return NextResponse.json({ seeded: true, message: 'Database already has data' })
    }
    return NextResponse.json({ seeded: false, message: 'Database needs seeding' }, { status: 404 })
  } catch (error) {
    return NextResponse.json({ seeded: false, message: 'Database check failed' }, { status: 404 })
  }
}

export async function POST() {
  try {
    console.log('[SEED] Starting comprehensive seed...')

    // ============================================
    // STEP 1: Check if data already exists — if so, skip seeding
    // ============================================
    const existingTenant = await db.tenant.findFirst()
    if (existingTenant) {
      console.log('[SEED] Data already exists, skipping seed.')
      return NextResponse.json({ success: true, message: 'Database already seeded, skipping' })
    }

    console.log('[SEED] Cleanup complete. Creating fresh data...')

    // ============================================
    // STEP 2: Create all data
    // ============================================

    // 1. TENANT
    const demoTenant = await db.tenant.create({
      data: {
        id: TENANT_ID,
        name: 'FleetFlow Demo Corp',
        slug: 'demo',
        dbName: 'ff_demo',
        dbReady: true,
        domain: 'demo.fleetflow.os',
        status: 'active',
        storageLimit: 5120,
        userLimit: 50,
        modulesEnabled: 'fleet,rental,customer,driver,fuel,maintenance,workshop,parts,finance,insurance,hr,documents,reports,ai',
      }
    })
    console.log('[SEED] ✓ Tenant')

    // 2. CLIENT
    const demoClient = await db.client.create({
      data: {
        id: CLIENT_ID,
        companyName: 'FleetFlow Demo Corp',
        slug: 'demo',
        contactPerson: 'Demo User',
        email: 'demo@fleetflow.os',
        phone: '+1-555-0100',
        country: 'United States',
        industryType: 'Fleet Management',
        subscriptionPlan: 'enterprise',
        licenseStatus: 'active',
        status: 'active',
        tenantId: demoTenant.id,
      }
    })
    console.log('[SEED] ✓ Client')

    // 3. USERS
    await db.user.create({ data: { email: 'demo@fleetflow.os', name: 'Demo User', password: 'demo_fleetflow_2024', role: 'demo', status: 'active', tenantId: demoTenant.id } })
    await db.user.create({ data: { email: 'admin@apexflow.cloud', name: 'System Administrator', password: 'Admin@180H', role: 'super_owner', status: 'active', tenantId: demoTenant.id } })
    console.log('[SEED] ✓ Users (2)')

    // 4. LICENSE
    await db.license.create({ data: { licenseKey: 'FFOS-DEMO-2024-ACTIVE', clientId: demoClient.id, status: 'active', maxDevices: 100, activationDate: new Date(), expiryDate: daysFromNow(365) } })
    console.log('[SEED] ✓ License')

    // 5. VEHICLES (15)
    await db.vehicle.createMany({ data: [
      { id: 'demo-vehicle-001', vehicleNumber: 'VH-001', registrationNumber: 'DXB-A-12345', make: 'Toyota', model: 'Camry', year: 2023, category: 'sedan', color: 'Pearl White', vin: '1HGCM82633A004352', engineNumber: 'ENG-TY-001', transmission: 'automatic', fuelType: 'petrol', mileage: 24500, status: 'available', dailyRate: 45, weeklyRate: 280, monthlyRate: 950, currentLocation: 'Dubai Marina', lastServiceDate: daysAgo(15), nextServiceDate: daysFromNow(45), insuranceExpiry: daysFromNow(180), registrationExpiry: daysFromNow(200), notes: 'Excellent condition, low mileage', tenantId: TENANT_ID },
      { id: 'demo-vehicle-002', vehicleNumber: 'VH-002', registrationNumber: 'DXB-A-67890', make: 'BMW', model: 'X5', year: 2024, category: 'suv', color: 'Carbon Black', vin: '2HGCM82633B005463', engineNumber: 'ENG-BMW-002', transmission: 'automatic', fuelType: 'diesel', mileage: 8200, status: 'rented', dailyRate: 150, weeklyRate: 900, monthlyRate: 3200, currentLocation: 'Downtown Dubai', lastServiceDate: daysAgo(30), nextServiceDate: daysFromNow(60), insuranceExpiry: daysFromNow(300), registrationExpiry: daysFromNow(250), notes: 'Premium SUV with leather interior', tenantId: TENANT_ID },
      { id: 'demo-vehicle-003', vehicleNumber: 'VH-003', registrationNumber: 'DXB-A-11111', make: 'Mercedes-Benz', model: 'E-Class', year: 2023, category: 'luxury', color: 'Obsidian Black', vin: '3HGCM82633C006574', engineNumber: 'ENG-MB-003', transmission: 'automatic', fuelType: 'petrol', mileage: 18700, status: 'reserved', dailyRate: 180, weeklyRate: 1100, monthlyRate: 3900, currentLocation: 'Palm Jumeirah', lastServiceDate: daysAgo(20), nextServiceDate: daysFromNow(40), insuranceExpiry: daysFromNow(150), registrationExpiry: daysFromNow(180), notes: 'Luxury sedan with panoramic roof', tenantId: TENANT_ID },
      { id: 'demo-vehicle-004', vehicleNumber: 'VH-004', registrationNumber: 'DXB-B-22222', make: 'Ford', model: 'Transit', year: 2022, category: 'van', color: 'White', vin: '4HGCM82633D007685', engineNumber: 'ENG-FD-004', transmission: 'automatic', fuelType: 'diesel', mileage: 62300, status: 'available', dailyRate: 65, weeklyRate: 400, monthlyRate: 1400, currentLocation: 'Jebel Ali', lastServiceDate: daysAgo(7), nextServiceDate: daysFromNow(23), insuranceExpiry: daysFromNow(90), registrationExpiry: daysFromNow(120), notes: 'Cargo van, high roof configuration', tenantId: TENANT_ID },
      { id: 'demo-vehicle-005', vehicleNumber: 'VH-005', registrationNumber: 'DXB-B-33333', make: 'Nissan', model: 'Patrol', year: 2023, category: 'suv', color: 'Gun Metallic', vin: '5HGCM82633E008796', engineNumber: 'ENG-NS-005', transmission: 'automatic', fuelType: 'petrol', mileage: 31400, status: 'rented', dailyRate: 130, weeklyRate: 780, monthlyRate: 2800, currentLocation: 'Abu Dhabi Road', lastServiceDate: daysAgo(25), nextServiceDate: daysFromNow(35), insuranceExpiry: daysFromNow(200), registrationExpiry: daysFromNow(220), notes: 'Off-road capable, desert trips', tenantId: TENANT_ID },
      { id: 'demo-vehicle-006', vehicleNumber: 'VH-006', registrationNumber: 'DXB-C-44444', make: 'Honda', model: 'Civic', year: 2024, category: 'sedan', color: 'Rallye Red', vin: '6HGCM82633F009807', engineNumber: 'ENG-HN-006', transmission: 'automatic', fuelType: 'petrol', mileage: 5600, status: 'available', dailyRate: 40, weeklyRate: 250, monthlyRate: 850, currentLocation: 'Deira City Center', lastServiceDate: daysAgo(45), nextServiceDate: daysFromNow(45), insuranceExpiry: daysFromNow(330), registrationExpiry: daysFromNow(300), notes: 'Economical daily commuter', tenantId: TENANT_ID },
      { id: 'demo-vehicle-007', vehicleNumber: 'VH-007', registrationNumber: 'DXB-C-55555', make: 'Toyota', model: 'Hilux', year: 2022, category: 'truck', color: 'Silver', vin: '7HGCM82633G010918', engineNumber: 'ENG-TY-007', transmission: 'manual', fuelType: 'diesel', mileage: 87600, status: 'maintenance', dailyRate: 85, weeklyRate: 520, monthlyRate: 1800, currentLocation: 'Al Quoz Workshop', lastServiceDate: daysAgo(2), nextServiceDate: daysFromNow(3), insuranceExpiry: daysFromNow(60), registrationExpiry: daysFromNow(90), notes: 'Pickup truck, heavy duty usage', tenantId: TENANT_ID },
      { id: 'demo-vehicle-008', vehicleNumber: 'VH-008', registrationNumber: 'DXB-D-66666', make: 'Mercedes-Benz', model: 'Sprinter', year: 2023, category: 'van', color: 'Arctic White', vin: '8HGCM82633H011029', engineNumber: 'ENG-MB-008', transmission: 'automatic', fuelType: 'diesel', mileage: 41200, status: 'in_service', dailyRate: 95, weeklyRate: 570, monthlyRate: 2000, currentLocation: 'Dubai Airport', lastServiceDate: daysAgo(10), nextServiceDate: daysFromNow(50), insuranceExpiry: daysFromNow(160), registrationExpiry: daysFromNow(190), notes: 'Passenger van, 12 seats', tenantId: TENANT_ID },
      { id: 'demo-vehicle-009', vehicleNumber: 'VH-009', registrationNumber: 'DXB-D-77777', make: 'Audi', model: 'A6', year: 2024, category: 'luxury', color: 'Mythos Black', vin: '9HGCM82633I012130', engineNumber: 'ENG-AD-009', transmission: 'automatic', fuelType: 'petrol', mileage: 3200, status: 'available', dailyRate: 200, weeklyRate: 1200, monthlyRate: 4200, currentLocation: 'Business Bay', lastServiceDate: daysAgo(60), nextServiceDate: daysFromNow(60), insuranceExpiry: daysFromNow(350), registrationExpiry: daysFromNow(340), notes: 'Executive luxury sedan', tenantId: TENANT_ID },
      { id: 'demo-vehicle-010', vehicleNumber: 'VH-010', registrationNumber: 'DXB-E-88888', make: 'Hyundai', model: 'H1', year: 2022, category: 'van', color: 'Titan Gray', vin: '0HGCM82633J013241', engineNumber: 'ENG-HY-010', transmission: 'manual', fuelType: 'diesel', mileage: 54800, status: 'rented', dailyRate: 70, weeklyRate: 430, monthlyRate: 1500, currentLocation: 'Sharjah', lastServiceDate: daysAgo(12), nextServiceDate: daysFromNow(18), insuranceExpiry: daysFromNow(100), registrationExpiry: daysFromNow(130), notes: 'Multi-purpose van', tenantId: TENANT_ID },
      { id: 'demo-vehicle-011', vehicleNumber: 'VH-011', registrationNumber: 'DXB-E-99999', make: 'Volvo', model: 'XC90', year: 2023, category: 'suv', color: 'Crystal White', vin: 'AHGCM82633K014352', engineNumber: 'ENG-VL-011', transmission: 'automatic', fuelType: 'hybrid', mileage: 22100, status: 'available', dailyRate: 160, weeklyRate: 960, monthlyRate: 3400, currentLocation: 'JBR Walk', lastServiceDate: daysAgo(18), nextServiceDate: daysFromNow(42), insuranceExpiry: daysFromNow(210), registrationExpiry: daysFromNow(230), notes: 'Hybrid SUV, eco-friendly', tenantId: TENANT_ID },
      { id: 'demo-vehicle-012', vehicleNumber: 'VH-012', registrationNumber: 'DXB-F-10101', make: 'Mitsubishi', model: 'Rosa', year: 2021, category: 'bus', color: 'White', vin: 'BHGCM82633L015463', engineNumber: 'ENG-MI-012', transmission: 'manual', fuelType: 'diesel', mileage: 98400, status: 'available', dailyRate: 250, weeklyRate: 1500, monthlyRate: 5200, currentLocation: 'Al Barsha', lastServiceDate: daysAgo(5), nextServiceDate: daysFromNow(25), insuranceExpiry: daysFromNow(70), registrationExpiry: daysFromNow(80), notes: '26-seater minibus', tenantId: TENANT_ID },
      { id: 'demo-vehicle-013', vehicleNumber: 'VH-013', registrationNumber: 'DXB-F-20202', make: 'Kia', model: 'K5', year: 2024, category: 'sedan', color: 'Wolf Grey', vin: 'CHGCM82633M016574', engineNumber: 'ENG-KI-013', transmission: 'automatic', fuelType: 'petrol', mileage: 7800, status: 'reserved', dailyRate: 50, weeklyRate: 310, monthlyRate: 1050, currentLocation: 'Dubai Silicon Oasis', lastServiceDate: daysAgo(50), nextServiceDate: daysFromNow(40), insuranceExpiry: daysFromNow(300), registrationExpiry: daysFromNow(280), notes: 'Sporty sedan with tech features', tenantId: TENANT_ID },
      { id: 'demo-vehicle-014', vehicleNumber: 'VH-014', registrationNumber: 'DXB-G-30303', make: 'Chevrolet', model: 'Silverado', year: 2022, category: 'truck', color: 'Northsky Blue', vin: 'DHGCM82633N017685', engineNumber: 'ENG-CH-014', transmission: 'automatic', fuelType: 'petrol', mileage: 73200, status: 'available', dailyRate: 95, weeklyRate: 580, monthlyRate: 2000, currentLocation: 'Dubai Investment Park', lastServiceDate: daysAgo(22), nextServiceDate: daysFromNow(8), insuranceExpiry: daysFromNow(120), registrationExpiry: daysFromNow(150), notes: 'Full-size pickup truck', tenantId: TENANT_ID },
      { id: 'demo-vehicle-015', vehicleNumber: 'VH-015', registrationNumber: 'DXB-G-40404', make: 'Tesla', model: 'Model 3', year: 2024, category: 'sedan', color: 'Pearl White', vin: 'EHGCM82633O018796', engineNumber: 'ENG-TS-015', transmission: 'automatic', fuelType: 'electric', mileage: 12400, status: 'available', dailyRate: 120, weeklyRate: 720, monthlyRate: 2500, currentLocation: 'Dubai Internet City', lastServiceDate: daysAgo(35), nextServiceDate: daysFromNow(55), insuranceExpiry: daysFromNow(310), registrationExpiry: daysFromNow(290), notes: 'Electric vehicle, zero emissions', tenantId: TENANT_ID },
    ] })
    console.log('[SEED] ✓ Vehicles (15)')

    // 6. CUSTOMERS (12)
    await db.customer.createMany({ data: [
      { id: 'demo-cust-001', firstName: 'Ahmed', lastName: 'Al-Rashid', email: 'ahmed.rashid@email.com', phone: '+971-50-111-1001', address: 'Villa 45, Palm Jumeirah', city: 'Dubai', country: 'UAE', nationality: 'Emirati', idNumber: 'UAE-784-1990-1234561', drivingLicense: 'DL-DXB-001234', licenseExpiry: daysFromNow(365), dateOfBirth: daysAgo(12400), emergencyContact: 'Fatima Al-Rashid', emergencyPhone: '+971-50-111-1002', status: 'active', notes: 'VIP customer, prefers luxury vehicles', totalRentals: 15, totalSpent: 28500, tenantId: TENANT_ID },
      { id: 'demo-cust-002', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@email.com', phone: '+1-555-234-5678', address: '1234 Oak Avenue, Apt 5B', city: 'Houston', country: 'United States', nationality: 'American', idNumber: 'US-SSN-456-78-9012', drivingLicense: 'DL-TX-567890', licenseExpiry: daysFromNow(180), dateOfBirth: daysAgo(10950), emergencyContact: 'Mike Johnson', emergencyPhone: '+1-555-234-5679', status: 'active', notes: 'Corporate account, monthly rentals', totalRentals: 8, totalSpent: 14200, tenantId: TENANT_ID },
      { id: 'demo-cust-003', firstName: 'Mohammed', lastName: 'Khan', email: 'mohammed.khan@email.com', phone: '+971-55-222-3003', address: 'Building 12, Dubai Marina Walk', city: 'Dubai', country: 'UAE', nationality: 'Pakistani', idNumber: 'PAK-35201-1234567', drivingLicense: 'DL-DXB-005678', licenseExpiry: daysFromNow(90), dateOfBirth: daysAgo(11680), emergencyContact: 'Ali Khan', emergencyPhone: '+971-55-222-3004', status: 'active', notes: 'Frequent long-term rental customer', totalRentals: 22, totalSpent: 45800, tenantId: TENANT_ID },
      { id: 'demo-cust-004', firstName: 'Elena', lastName: 'Petrova', email: 'elena.petrova@email.com', phone: '+7-495-333-4404', address: 'JBR Sadaf Tower, Apt 1802', city: 'Dubai', country: 'Russia', nationality: 'Russian', idNumber: 'RU-7701-2345678', drivingLicense: 'DL-RU-1234567', licenseExpiry: daysFromNow(270), dateOfBirth: daysAgo(10220), emergencyContact: 'Dmitry Petrov', emergencyPhone: '+7-495-333-4405', status: 'active', notes: 'Tourist, prefers SUV rentals', totalRentals: 4, totalSpent: 8900, tenantId: TENANT_ID },
      { id: 'demo-cust-005', firstName: 'James', lastName: 'Williams', email: 'james.williams@email.com', phone: '+44-20-555-6605', address: 'Office 506, One Financial Center', city: 'London', country: 'United Kingdom', nationality: 'British', idNumber: 'UK-AB123456C', drivingLicense: 'DL-UK-WILLI89012', licenseExpiry: daysFromNow(200), dateOfBirth: daysAgo(13500), emergencyContact: 'Linda Williams', emergencyPhone: '+44-20-555-6606', status: 'active', notes: 'Business executive, short-term luxury rentals', totalRentals: 11, totalSpent: 32100, tenantId: TENANT_ID },
      { id: 'demo-cust-006', firstName: 'Aisha', lastName: 'Al-Mansouri', email: 'aisha.mansouri@email.com', phone: '+971-50-666-7706', address: 'Al Wasl Road, Villa 78', city: 'Dubai', country: 'UAE', nationality: 'Emirati', idNumber: 'UAE-784-1988-6543210', drivingLicense: 'DL-DXB-009876', licenseExpiry: daysFromNow(150), dateOfBirth: daysAgo(13140), emergencyContact: 'Omar Al-Mansouri', emergencyPhone: '+971-50-666-7707', status: 'active', notes: 'Family customer, prefers vans for weekend trips', totalRentals: 6, totalSpent: 9800, tenantId: TENANT_ID },
      { id: 'demo-cust-007', firstName: 'Raj', lastName: 'Patel', email: 'raj.patel@email.com', phone: '+91-22-777-8807', address: 'Cluster D, JLT, Tower B, Apt 903', city: 'Dubai', country: 'India', nationality: 'Indian', idNumber: 'IND-ABCD12345', drivingLicense: 'DL-DXB-003456', licenseExpiry: daysFromNow(60), dateOfBirth: daysAgo(11680), emergencyContact: 'Priya Patel', emergencyPhone: '+91-22-777-8808', status: 'inactive', notes: 'Account suspended due to late return', totalRentals: 3, totalSpent: 2400, tenantId: TENANT_ID },
      { id: 'demo-cust-008', firstName: 'Chen', lastName: 'Wei', email: 'chen.wei@email.com', phone: '+86-21-888-9908', address: 'Dubai Creek Tower, Apt 2201', city: 'Dubai', country: 'China', nationality: 'Chinese', idNumber: 'CHN-310101199001011234', drivingLicense: 'DL-CHN-SH12345', licenseExpiry: daysFromNow(120), dateOfBirth: daysAgo(12045), emergencyContact: 'Liu Wei', emergencyPhone: '+86-21-888-9909', status: 'active', notes: 'Business traveler', totalRentals: 9, totalSpent: 18700, tenantId: TENANT_ID },
      { id: 'demo-cust-009', firstName: 'Maria', lastName: 'Santos', email: 'maria.santos@email.com', phone: '+55-11-999-0009', address: 'Dubai Hills, Park Ridge, Apt 1205', city: 'Dubai', country: 'Brazil', nationality: 'Brazilian', idNumber: 'BRA-123.456.789-00', drivingLicense: 'DL-BRA-SP98765', licenseExpiry: daysFromNow(300), dateOfBirth: daysAgo(10500), emergencyContact: 'Carlos Santos', emergencyPhone: '+55-11-999-0010', status: 'active', notes: 'Long-term rental customer', totalRentals: 7, totalSpent: 21500, tenantId: TENANT_ID },
      { id: 'demo-cust-010', firstName: 'David', lastName: 'Mueller', email: 'david.mueller@email.com', phone: '+49-30-101-1110', address: 'Emirates Living, Springs 14', city: 'Dubai', country: 'Germany', nationality: 'German', idNumber: 'DE-T220001293', drivingLicense: 'DL-DE-B1234567', licenseExpiry: daysFromNow(240), dateOfBirth: daysAgo(12775), emergencyContact: 'Anna Mueller', emergencyPhone: '+49-30-101-1111', status: 'active', notes: 'Corporate client, quarterly rentals', totalRentals: 5, totalSpent: 15600, tenantId: TENANT_ID },
      { id: 'demo-cust-011', firstName: 'Yuki', lastName: 'Tanaka', email: 'yuki.tanaka@email.com', phone: '+81-3-222-3311', address: 'DIFC, Index Tower, Apt 3501', city: 'Dubai', country: 'Japan', nationality: 'Japanese', idNumber: 'JPN-123456789012', drivingLicense: 'DL-JPN-TK54321', licenseExpiry: daysFromNow(180), dateOfBirth: daysAgo(11300), emergencyContact: 'Kenji Tanaka', emergencyPhone: '+81-3-222-3312', status: 'active', notes: 'Expat on 2-year assignment', totalRentals: 12, totalSpent: 26800, tenantId: TENANT_ID },
      { id: 'demo-cust-012', firstName: 'Omar', lastName: 'Hassan', email: 'omar.hassan@email.com', phone: '+20-2-333-4412', address: 'Mirdif Hills, Apt 604', city: 'Dubai', country: 'Egypt', nationality: 'Egyptian', idNumber: 'EGY-29901011234567', drivingLicense: 'DL-EGY-CA12345', licenseExpiry: daysFromNow(30), dateOfBirth: daysAgo(12000), emergencyContact: 'Fatma Hassan', emergencyPhone: '+20-2-333-4413', status: 'inactive', notes: 'License expiring soon, requires renewal', totalRentals: 2, totalSpent: 1800, tenantId: TENANT_ID },
    ] })
    console.log('[SEED] ✓ Customers (12)')

    // 7. DRIVERS (8)
    await db.driver.createMany({ data: [
      { id: 'demo-driver-001', firstName: 'Ali', lastName: 'Rezaei', email: 'ali.rezaei@fleetflow.os', phone: '+971-50-100-2001', licenseNumber: 'DL-DXB-D001', licenseExpiry: daysFromNow(365), licenseClass: 'Heavy Vehicle', address: 'Al Karama, Dubai', city: 'Dubai', nationality: 'Iranian', dateOfBirth: daysAgo(13000), hireDate: daysAgo(730), status: 'active', rating: 4.8, totalTrips: 342, totalDistance: 78500, emergencyContact: '+971-50-100-2002', notes: 'Senior driver, excellent safety record', tenantId: TENANT_ID },
      { id: 'demo-driver-002', firstName: 'John', lastName: 'Martinez', email: 'john.martinez@fleetflow.os', phone: '+971-55-200-3002', licenseNumber: 'DL-DXB-D002', licenseExpiry: daysFromNow(270), licenseClass: 'Light Vehicle', address: 'Bur Dubai, Dubai', city: 'Dubai', nationality: 'Filipino', dateOfBirth: daysAgo(11500), hireDate: daysAgo(540), status: 'active', rating: 4.5, totalTrips: 218, totalDistance: 42300, emergencyContact: '+971-55-200-3003', notes: 'Airport transfer specialist', tenantId: TENANT_ID },
      { id: 'demo-driver-003', firstName: 'Rashid', lastName: 'Al-Fahim', email: 'rashid.fahim@fleetflow.os', phone: '+971-50-300-4003', licenseNumber: 'DL-DXB-D003', licenseExpiry: daysFromNow(180), licenseClass: 'Heavy Vehicle', address: 'Al Nahda, Sharjah', city: 'Sharjah', nationality: 'Emirati', dateOfBirth: daysAgo(12000), hireDate: daysAgo(900), status: 'active', rating: 4.9, totalTrips: 567, totalDistance: 142000, emergencyContact: '+971-50-300-4004', notes: 'Desert route expert, long-haul specialist', tenantId: TENANT_ID },
      { id: 'demo-driver-004', firstName: 'Sunil', lastName: 'Perera', email: 'sunil.perera@fleetflow.os', phone: '+971-55-400-5004', licenseNumber: 'DL-DXB-D004', licenseExpiry: daysFromNow(90), licenseClass: 'Light Vehicle', address: 'Deira, Dubai', city: 'Dubai', nationality: 'Sri Lankan', dateOfBirth: daysAgo(12500), hireDate: daysAgo(365), status: 'off-duty', rating: 4.2, totalTrips: 156, totalDistance: 31200, emergencyContact: '+971-55-400-5005', notes: 'On personal leave until next month', tenantId: TENANT_ID },
      { id: 'demo-driver-005', firstName: 'Mikhail', lastName: 'Volkov', email: 'mikhail.volkov@fleetflow.os', phone: '+971-50-500-6005', licenseNumber: 'DL-DXB-D005', licenseExpiry: daysFromNow(300), licenseClass: 'Medium Vehicle', address: 'Dubai Marina, Dubai', city: 'Dubai', nationality: 'Russian', dateOfBirth: daysAgo(11000), hireDate: daysAgo(450), status: 'active', rating: 4.6, totalTrips: 289, totalDistance: 67800, emergencyContact: '+971-50-500-6006', notes: 'VIP transport driver', tenantId: TENANT_ID },
      { id: 'demo-driver-006', firstName: 'Hassan', lastName: 'Ibrahim', email: 'hassan.ibrahim@fleetflow.os', phone: '+971-55-600-7006', licenseNumber: 'DL-DXB-D006', licenseExpiry: daysFromNow(60), licenseClass: 'Heavy Vehicle', address: 'Al Quoz, Dubai', city: 'Dubai', nationality: 'Sudanese', dateOfBirth: daysAgo(13500), hireDate: daysAgo(600), status: 'suspended', rating: 3.4, totalTrips: 98, totalDistance: 22100, emergencyContact: '+971-55-600-7007', notes: 'Suspended due to safety violation', tenantId: TENANT_ID },
      { id: 'demo-driver-007', firstName: 'Carlos', lastName: 'Gomez', email: 'carlos.gomez@fleetflow.os', phone: '+971-50-700-8007', licenseNumber: 'DL-DXB-D007', licenseExpiry: daysFromNow(200), licenseClass: 'Light Vehicle', address: 'JLT, Dubai', city: 'Dubai', nationality: 'Colombian', dateOfBirth: daysAgo(10500), hireDate: daysAgo(200), status: 'active', rating: 4.3, totalTrips: 87, totalDistance: 19500, emergencyContact: '+971-50-700-8008', notes: 'City route specialist', tenantId: TENANT_ID },
      { id: 'demo-driver-008', firstName: 'Ahmed', lastName: 'Nasser', email: 'ahmed.nasser@fleetflow.os', phone: '+971-55-800-9008', licenseNumber: 'DL-DXB-D008', licenseExpiry: daysFromNow(150), licenseClass: 'Medium Vehicle', address: 'Al Barsha, Dubai', city: 'Dubai', nationality: 'Egyptian', dateOfBirth: daysAgo(11800), hireDate: daysAgo(800), status: 'active', rating: 4.7, totalTrips: 412, totalDistance: 96500, emergencyContact: '+971-55-800-9009', notes: 'Senior driver, bus operations', tenantId: TENANT_ID },
    ] })
    console.log('[SEED] ✓ Drivers (8)')

    // 8. RESERVATIONS (10) — must use individual creates because of foreign key relations
    const reservationsData = [
      { id: 'demo-res-001', reservationCode: 'RES-100001', customerId: 'demo-cust-001', vehicleId: 'demo-vehicle-002', startDate: daysAgo(5), endDate: daysAgo(2), pickupLocation: 'Dubai Marina Branch', returnLocation: 'Dubai Marina Branch', totalAmount: 450, depositAmount: 150, status: 'completed', notes: 'Weekend SUV rental', tenantId: TENANT_ID },
      { id: 'demo-res-002', reservationCode: 'RES-100002', customerId: 'demo-cust-003', vehicleId: 'demo-vehicle-005', startDate: daysAgo(3), endDate: daysFromNow(4), pickupLocation: 'Business Bay Office', returnLocation: 'Business Bay Office', totalAmount: 910, depositAmount: 300, status: 'active', notes: 'Weekly rental for business trip', tenantId: TENANT_ID },
      { id: 'demo-res-003', reservationCode: 'RES-100003', customerId: 'demo-cust-005', vehicleId: 'demo-vehicle-009', startDate: daysAgo(1), endDate: daysFromNow(2), totalAmount: 600, depositAmount: 200, status: 'active', notes: 'Executive luxury rental', tenantId: TENANT_ID },
      { id: 'demo-res-004', reservationCode: 'RES-100004', customerId: 'demo-cust-002', vehicleId: 'demo-vehicle-010', startDate: daysFromNow(3), endDate: daysFromNow(10), pickupLocation: 'Jebel Ali Free Zone', returnLocation: 'Jebel Ali Free Zone', totalAmount: 490, depositAmount: 150, status: 'confirmed', notes: 'Cargo van for office move', tenantId: TENANT_ID },
      { id: 'demo-res-005', reservationCode: 'RES-100005', customerId: 'demo-cust-006', vehicleId: 'demo-vehicle-008', startDate: daysFromNow(5), endDate: daysFromNow(7), pickupLocation: 'Dubai Airport T3', returnLocation: 'Dubai Airport T3', totalAmount: 190, depositAmount: 100, status: 'confirmed', notes: 'Family airport pickup', tenantId: TENANT_ID },
      { id: 'demo-res-006', reservationCode: 'RES-100006', customerId: 'demo-cust-009', vehicleId: 'demo-vehicle-001', startDate: daysAgo(10), endDate: daysAgo(7), pickupLocation: 'Deira City Center', returnLocation: 'Deira City Center', totalAmount: 135, depositAmount: 45, status: 'completed', notes: 'Economy sedan rental', tenantId: TENANT_ID },
      { id: 'demo-res-007', reservationCode: 'RES-100007', customerId: 'demo-cust-004', vehicleId: 'demo-vehicle-011', startDate: daysFromNow(7), endDate: daysFromNow(14), pickupLocation: 'Palm Jumeirah', returnLocation: 'Palm Jumeirah', totalAmount: 1120, depositAmount: 400, status: 'pending', notes: 'Two-week SUV rental for desert tour', tenantId: TENANT_ID },
      { id: 'demo-res-008', reservationCode: 'RES-100008', customerId: 'demo-cust-008', vehicleId: 'demo-vehicle-003', startDate: daysAgo(20), endDate: daysAgo(18), pickupLocation: 'DIFC', returnLocation: 'DIFC', totalAmount: 360, depositAmount: 180, status: 'completed', notes: 'Short luxury rental', tenantId: TENANT_ID },
      { id: 'demo-res-009', reservationCode: 'RES-100009', customerId: 'demo-cust-011', vehicleId: 'demo-vehicle-015', startDate: daysFromNow(2), endDate: daysFromNow(5), pickupLocation: 'Dubai Internet City', returnLocation: 'Dubai Internet City', totalAmount: 360, depositAmount: 120, status: 'confirmed', notes: 'Electric vehicle trial', tenantId: TENANT_ID },
      { id: 'demo-res-010', reservationCode: 'RES-100010', customerId: 'demo-cust-010', vehicleId: 'demo-vehicle-013', startDate: daysAgo(15), endDate: daysAgo(14), totalAmount: 50, depositAmount: 25, status: 'cancelled', notes: 'Cancelled due to flight change', tenantId: TENANT_ID },
    ]
    for (const r of reservationsData) {
      await db.reservation.create({ data: r })
    }
    console.log('[SEED] ✓ Reservations (10)')

    // 9. RENTAL CONTRACTS (6)
    const contractsData = [
      { id: 'demo-contract-001', contractNumber: 'CTR-200001', reservationId: 'demo-res-001', customerId: 'demo-cust-001', vehicleId: 'demo-vehicle-002', startDate: daysAgo(5), endDate: daysAgo(2), dailyRate: 150, totalDays: 3, totalAmount: 450, depositAmount: 150, mileageLimit: 300, mileageOut: 8200, mileageIn: 8650, terms: 'Standard rental terms and conditions apply.', status: 'completed', signedDate: daysAgo(5), returnDate: daysAgo(2), notes: 'Returned in excellent condition', tenantId: TENANT_ID },
      { id: 'demo-contract-002', contractNumber: 'CTR-200002', reservationId: 'demo-res-002', customerId: 'demo-cust-003', vehicleId: 'demo-vehicle-005', startDate: daysAgo(3), endDate: daysFromNow(4), dailyRate: 130, totalDays: 7, totalAmount: 910, depositAmount: 300, mileageLimit: 350, mileageOut: 31400, mileageIn: 0, terms: 'Weekly rate applied. Insurance included.', status: 'active', signedDate: daysAgo(3), notes: 'Currently active rental', tenantId: TENANT_ID },
      { id: 'demo-contract-003', contractNumber: 'CTR-200003', reservationId: 'demo-res-003', customerId: 'demo-cust-005', vehicleId: 'demo-vehicle-009', startDate: daysAgo(1), endDate: daysFromNow(2), dailyRate: 200, totalDays: 3, totalAmount: 600, depositAmount: 200, mileageLimit: 250, mileageOut: 3200, mileageIn: 0, terms: 'Luxury vehicle terms. Zero excess option selected.', status: 'active', signedDate: daysAgo(1), notes: 'Executive rental with zero excess insurance', tenantId: TENANT_ID },
      { id: 'demo-contract-004', contractNumber: 'CTR-200004', reservationId: 'demo-res-006', customerId: 'demo-cust-009', vehicleId: 'demo-vehicle-001', startDate: daysAgo(10), endDate: daysAgo(7), dailyRate: 45, totalDays: 3, totalAmount: 135, depositAmount: 45, mileageLimit: 200, mileageOut: 24500, mileageIn: 25100, terms: 'Economy rental terms. Basic insurance included.', status: 'completed', signedDate: daysAgo(10), returnDate: daysAgo(7), notes: 'Minor scratch on bumper noted', tenantId: TENANT_ID },
      { id: 'demo-contract-005', contractNumber: 'CTR-200005', reservationId: 'demo-res-008', customerId: 'demo-cust-008', vehicleId: 'demo-vehicle-003', startDate: daysAgo(20), endDate: daysAgo(18), dailyRate: 180, totalDays: 2, totalAmount: 360, depositAmount: 180, mileageLimit: 300, mileageOut: 18700, mileageIn: 19150, terms: 'Luxury rental terms. Full comprehensive insurance.', status: 'completed', signedDate: daysAgo(20), returnDate: daysAgo(18), notes: 'Clean return, no issues', tenantId: TENANT_ID },
      { id: 'demo-contract-006', contractNumber: 'CTR-200006', customerId: 'demo-cust-002', vehicleId: 'demo-vehicle-006', startDate: daysAgo(25), endDate: daysAgo(20), dailyRate: 40, totalDays: 5, totalAmount: 200, depositAmount: 80, mileageLimit: 200, mileageOut: 5600, mileageIn: 6400, terms: 'Standard rental terms.', status: 'terminated', signedDate: daysAgo(25), returnDate: daysAgo(22), notes: 'Early return, refund processed', tenantId: TENANT_ID },
    ]
    for (const c of contractsData) {
      await db.rentalContract.create({ data: c })
    }
    console.log('[SEED] ✓ Rental Contracts (6)')

    // 10. DEPOSITS (4)
    await db.deposit.createMany({ data: [
      { id: 'demo-deposit-001', contractId: 'demo-contract-001', customerId: 'demo-cust-001', amount: 150, type: 'security', status: 'returned', method: 'credit_card', returnedDate: daysAgo(1), returnedAmount: 150, notes: 'Full deposit returned', tenantId: TENANT_ID },
      { id: 'demo-deposit-002', contractId: 'demo-contract-002', customerId: 'demo-cust-003', amount: 300, type: 'security', status: 'held', method: 'credit_card', notes: 'Currently held for active rental', tenantId: TENANT_ID },
      { id: 'demo-deposit-003', contractId: 'demo-contract-003', customerId: 'demo-cust-005', amount: 200, type: 'security', status: 'held', method: 'bank_transfer', notes: 'Held for luxury vehicle rental', tenantId: TENANT_ID },
      { id: 'demo-deposit-004', contractId: 'demo-contract-004', customerId: 'demo-cust-009', amount: 45, type: 'advance', status: 'forfeited', method: 'cash', returnedDate: daysAgo(5), returnedAmount: 0, notes: 'Deposit forfeited due to bumper damage', tenantId: TENANT_ID },
    ] })
    console.log('[SEED] ✓ Deposits (4)')

    // 11. DAMAGE REPORTS (3)
    const damageReportsData = [
      { id: 'demo-damage-001', vehicleId: 'demo-vehicle-001', customerId: 'demo-cust-009', contractId: 'demo-contract-004', reportedDate: daysAgo(7), description: 'Scratch on rear bumper approximately 15cm long. Paint damage visible on white surface.', severity: 'minor', location: 'Rear bumper', repairCost: 250, insuranceClaim: false, status: 'repaired', notes: 'Repaired at Al Quoz body shop', tenantId: TENANT_ID },
      { id: 'demo-damage-002', vehicleId: 'demo-vehicle-007', reportedDate: daysAgo(3), description: 'Engine overheating issue. Coolant leak detected from radiator hose connection.', severity: 'moderate', location: 'Engine compartment', repairCost: 850, insuranceClaim: false, status: 'repairing', notes: 'Parts ordered, awaiting delivery', tenantId: TENANT_ID },
      { id: 'demo-damage-003', vehicleId: 'demo-vehicle-005', customerId: 'demo-cust-003', contractId: 'demo-contract-002', reportedDate: daysAgo(1), description: 'Dent on passenger door from parking lot incident. Minor paint chip.', severity: 'minor', location: 'Passenger side door', repairCost: 400, insuranceClaim: true, status: 'assessed', notes: 'Insurance claim filed', tenantId: TENANT_ID },
    ]
    for (const dr of damageReportsData) {
      await db.damageReport.create({ data: dr })
    }
    console.log('[SEED] ✓ Damage Reports (3)')

    // 12. DISPATCH ORDERS (5)
    const dispatchOrdersData = [
      { id: 'demo-dispatch-001', orderNumber: 'DSP-300001', driverId: 'demo-driver-001', priority: 'normal', origin: 'Dubai Marina', destination: 'Abu Dhabi Corniche', scheduledTime: daysAgo(2), completedTime: daysAgo(2), instructions: 'Deliver vehicle to Abu Dhabi branch.', status: 'completed', tenantId: TENANT_ID },
      { id: 'demo-dispatch-002', orderNumber: 'DSP-300002', driverId: 'demo-driver-003', priority: 'high', origin: 'Al Quoz Workshop', destination: 'Business Bay Office', scheduledTime: hoursAgo(4), instructions: 'Urgent vehicle delivery for VIP client.', status: 'in_progress', tenantId: TENANT_ID },
      { id: 'demo-dispatch-003', orderNumber: 'DSP-300003', driverId: 'demo-driver-005', priority: 'normal', origin: 'Dubai Airport T3', destination: 'Palm Jumeirah Atlantis', scheduledTime: hoursFromNow(6), instructions: 'Airport pickup for corporate delegation.', status: 'assigned', tenantId: TENANT_ID },
      { id: 'demo-dispatch-004', orderNumber: 'DSP-300004', driverId: 'demo-driver-008', priority: 'low', origin: 'Jebel Ali Port', destination: 'Dubai Investment Park', scheduledTime: daysFromNow(1), instructions: 'Pickup cargo from port.', status: 'pending', tenantId: TENANT_ID },
      { id: 'demo-dispatch-005', orderNumber: 'DSP-300005', driverId: 'demo-driver-007', priority: 'urgent', origin: 'DIFC', destination: 'Dubai Airport T1', scheduledTime: hoursAgo(1), completedTime: hoursAgo(0), instructions: 'Emergency airport transfer for executive.', status: 'completed', tenantId: TENANT_ID },
    ]
    for (const d of dispatchOrdersData) {
      await db.dispatchOrder.create({ data: d })
    }
    console.log('[SEED] ✓ Dispatch Orders (5)')

    // 13. TRIPS (8)
    const tripsData = [
      { id: 'demo-trip-001', dispatchOrderId: 'demo-dispatch-001', driverId: 'demo-driver-001', vehicleId: 'demo-vehicle-004', origin: 'Dubai Marina', destination: 'Abu Dhabi Corniche', startTime: daysAgo(2), endTime: daysAgo(2), distance: 149, status: 'completed', notes: 'Smooth drive, arrived on time', tenantId: TENANT_ID },
      { id: 'demo-trip-002', dispatchOrderId: 'demo-dispatch-002', driverId: 'demo-driver-003', vehicleId: 'demo-vehicle-011', origin: 'Al Quoz Workshop', destination: 'Business Bay Office', startTime: hoursAgo(3), distance: 12, status: 'in_progress', notes: 'En route to Business Bay', tenantId: TENANT_ID },
      { id: 'demo-trip-003', dispatchOrderId: 'demo-dispatch-003', driverId: 'demo-driver-005', vehicleId: 'demo-vehicle-003', origin: 'Dubai Airport T3', destination: 'Palm Jumeirah Atlantis', startTime: hoursFromNow(6), distance: 0, status: 'planned', notes: 'Scheduled for this afternoon', tenantId: TENANT_ID },
      { id: 'demo-trip-004', dispatchOrderId: 'demo-dispatch-005', driverId: 'demo-driver-007', vehicleId: 'demo-vehicle-009', origin: 'DIFC', destination: 'Dubai Airport T1', startTime: hoursAgo(1), endTime: hoursAgo(0), distance: 18, status: 'completed', notes: 'VIP transfer completed', tenantId: TENANT_ID },
      { id: 'demo-trip-005', driverId: 'demo-driver-002', vehicleId: 'demo-vehicle-008', origin: 'Dubai Airport T1', destination: 'Deira City Center', startTime: daysAgo(1), endTime: daysAgo(1), distance: 8, status: 'completed', notes: 'Airport shuttle run', tenantId: TENANT_ID },
      { id: 'demo-trip-006', driverId: 'demo-driver-008', vehicleId: 'demo-vehicle-012', origin: 'Al Barsha', destination: 'Dubai Festival City', startTime: daysAgo(4), endTime: daysAgo(4), distance: 22, status: 'completed', notes: 'Group transport for corporate event', tenantId: TENANT_ID },
      { id: 'demo-trip-007', driverId: 'demo-driver-001', vehicleId: 'demo-vehicle-014', origin: 'Dubai Investment Park', destination: 'Jebel Ali Port', startTime: daysAgo(6), endTime: daysAgo(6), distance: 15, status: 'completed', notes: 'Cargo delivery completed', tenantId: TENANT_ID },
      { id: 'demo-trip-008', driverId: 'demo-driver-005', vehicleId: 'demo-vehicle-002', origin: 'Business Bay', destination: 'Dubai Marina', startTime: daysAgo(8), endTime: daysAgo(8), distance: 6, status: 'completed', notes: 'VIP client transfer', tenantId: TENANT_ID },
    ]
    for (const t of tripsData) {
      await db.trip.create({ data: t })
    }
    console.log('[SEED] ✓ Trips (8)')

    // 14. GPS LOCATIONS (20)
    await db.gpsLocation.createMany({ data: [
      { id: 'demo-gps-001', vehicleId: 'demo-vehicle-002', latitude: 25.1972, longitude: 55.2744, speed: 45, heading: 180, timestamp: hoursAgo(1), tenantId: TENANT_ID },
      { id: 'demo-gps-002', vehicleId: 'demo-vehicle-002', latitude: 25.2048, longitude: 55.2708, speed: 30, heading: 90, timestamp: hoursAgo(2), tenantId: TENANT_ID },
      { id: 'demo-gps-003', vehicleId: 'demo-vehicle-005', latitude: 25.0750, longitude: 55.1400, speed: 110, heading: 270, timestamp: hoursAgo(1), tenantId: TENANT_ID },
      { id: 'demo-gps-004', vehicleId: 'demo-vehicle-005', latitude: 25.0500, longitude: 55.2000, speed: 85, heading: 180, timestamp: hoursAgo(3), tenantId: TENANT_ID },
      { id: 'demo-gps-005', vehicleId: 'demo-vehicle-009', latitude: 25.2155, longitude: 55.2803, speed: 0, heading: 0, timestamp: hoursAgo(0), tenantId: TENANT_ID },
      { id: 'demo-gps-006', vehicleId: 'demo-vehicle-009', latitude: 25.2100, longitude: 55.2750, speed: 25, heading: 45, timestamp: hoursAgo(2), tenantId: TENANT_ID },
      { id: 'demo-gps-007', vehicleId: 'demo-vehicle-001', latitude: 25.0800, longitude: 55.1400, speed: 0, heading: 0, timestamp: hoursAgo(1), tenantId: TENANT_ID },
      { id: 'demo-gps-008', vehicleId: 'demo-vehicle-004', latitude: 24.9800, longitude: 55.0600, speed: 0, heading: 0, timestamp: hoursAgo(1), tenantId: TENANT_ID },
      { id: 'demo-gps-009', vehicleId: 'demo-vehicle-008', latitude: 25.2532, longitude: 55.3657, speed: 15, heading: 270, timestamp: hoursAgo(1), tenantId: TENANT_ID },
      { id: 'demo-gps-010', vehicleId: 'demo-vehicle-008', latitude: 25.2400, longitude: 55.3500, speed: 35, heading: 180, timestamp: hoursAgo(3), tenantId: TENANT_ID },
      { id: 'demo-gps-011', vehicleId: 'demo-vehicle-010', latitude: 25.3300, longitude: 55.3800, speed: 55, heading: 90, timestamp: hoursAgo(1), tenantId: TENANT_ID },
      { id: 'demo-gps-012', vehicleId: 'demo-vehicle-010', latitude: 25.3100, longitude: 55.4000, speed: 40, heading: 180, timestamp: hoursAgo(4), tenantId: TENANT_ID },
      { id: 'demo-gps-013', vehicleId: 'demo-vehicle-011', latitude: 25.0780, longitude: 55.1320, speed: 0, heading: 0, timestamp: hoursAgo(1), tenantId: TENANT_ID },
      { id: 'demo-gps-014', vehicleId: 'demo-vehicle-012', latitude: 25.1100, longitude: 55.2400, speed: 0, heading: 0, timestamp: hoursAgo(1), tenantId: TENANT_ID },
      { id: 'demo-gps-015', vehicleId: 'demo-vehicle-007', latitude: 25.1400, longitude: 55.2300, speed: 0, heading: 0, timestamp: hoursAgo(2), tenantId: TENANT_ID },
      { id: 'demo-gps-016', vehicleId: 'demo-vehicle-014', latitude: 25.0500, longitude: 55.2100, speed: 0, heading: 0, timestamp: hoursAgo(1), tenantId: TENANT_ID },
      { id: 'demo-gps-017', vehicleId: 'demo-vehicle-015', latitude: 25.1000, longitude: 55.1700, speed: 0, heading: 0, timestamp: hoursAgo(1), tenantId: TENANT_ID },
      { id: 'demo-gps-018', vehicleId: 'demo-vehicle-003', latitude: 25.1120, longitude: 55.1390, speed: 0, heading: 0, timestamp: hoursAgo(1), tenantId: TENANT_ID },
      { id: 'demo-gps-019', vehicleId: 'demo-vehicle-006', latitude: 25.2700, longitude: 55.3300, speed: 20, heading: 90, timestamp: hoursAgo(2), tenantId: TENANT_ID },
      { id: 'demo-gps-020', vehicleId: 'demo-vehicle-013', latitude: 25.1300, longitude: 55.2100, speed: 0, heading: 0, timestamp: hoursAgo(1), tenantId: TENANT_ID },
    ] })
    console.log('[SEED] ✓ GPS Locations (20)')

    // 15. MAINTENANCE RECORDS (6)
    const maintenanceData = [
      { id: 'demo-maint-001', vehicleId: 'demo-vehicle-007', type: 'corrective', category: 'engine', description: 'Engine overheating - coolant leak from radiator hose. Needs hose replacement and coolant flush.', scheduledDate: daysAgo(2), cost: 0, vendor: 'Al Quoz Auto Workshop', odometer: 87600, status: 'in_progress', priority: 'high', notes: 'Parts on order.', tenantId: TENANT_ID },
      { id: 'demo-maint-002', vehicleId: 'demo-vehicle-001', type: 'preventive', category: 'engine', description: 'Regular oil change and filter replacement. 15,000 km service interval.', scheduledDate: daysAgo(15), completedDate: daysAgo(14), cost: 350, vendor: 'Toyota Service Center Dubai', odometer: 24500, status: 'completed', priority: 'normal', notes: 'All filters replaced.', tenantId: TENANT_ID },
      { id: 'demo-maint-003', vehicleId: 'demo-vehicle-004', type: 'preventive', category: 'brakes', description: 'Brake pad inspection and replacement. Front brakes showing 30% wear.', scheduledDate: daysFromNow(23), cost: 0, vendor: 'Ford Authorized Service', odometer: 62300, status: 'scheduled', priority: 'normal', notes: 'Scheduled based on mileage interval', tenantId: TENANT_ID },
      { id: 'demo-maint-004', vehicleId: 'demo-vehicle-012', type: 'preventive', category: 'tires', description: 'Full tire rotation and alignment check.', scheduledDate: daysAgo(5), completedDate: daysAgo(4), cost: 580, vendor: 'TireZone Al Quoz', odometer: 98400, status: 'completed', priority: 'normal', notes: 'Two rear tires replaced.', tenantId: TENANT_ID },
      { id: 'demo-maint-005', vehicleId: 'demo-vehicle-002', type: 'preventive', category: 'engine', description: 'Scheduled 10,000 km service. Oil change, multi-point inspection.', scheduledDate: daysFromNow(60), cost: 0, vendor: 'BMW Service Center', odometer: 8200, status: 'scheduled', priority: 'low', notes: 'Next scheduled service', tenantId: TENANT_ID },
      { id: 'demo-maint-006', vehicleId: 'demo-vehicle-014', type: 'corrective', category: 'electrical', description: 'Battery draining overnight. Alternator output below specification.', scheduledDate: daysAgo(8), completedDate: daysAgo(6), cost: 1200, vendor: 'Quick Fit Auto', odometer: 73200, status: 'completed', priority: 'urgent', notes: 'Alternator and battery replaced.', tenantId: TENANT_ID },
    ]
    for (const m of maintenanceData) {
      await db.maintenanceRecord.create({ data: m })
    }
    console.log('[SEED] ✓ Maintenance Records (6)')

    // 16. JOB CARDS (4)
    await db.jobCard.createMany({ data: [
      { id: 'demo-jobcard-001', maintenanceId: 'demo-maint-001', technician: 'Raju Kumar', estimatedHours: 6, actualHours: 4, laborCost: 300, partsCost: 550, totalCost: 850, status: 'in_progress', notes: 'Awaiting radiator hose delivery.', tenantId: TENANT_ID },
      { id: 'demo-jobcard-002', maintenanceId: 'demo-maint-002', technician: 'Ahmed Salah', estimatedHours: 2, actualHours: 1.5, laborCost: 150, partsCost: 200, totalCost: 350, status: 'completed', notes: 'Service completed within estimated time.', tenantId: TENANT_ID },
      { id: 'demo-jobcard-003', maintenanceId: 'demo-maint-004', technician: 'Sam Perera', estimatedHours: 3, actualHours: 4, laborCost: 200, partsCost: 380, totalCost: 580, status: 'completed', notes: 'Additional tire replacement needed.', tenantId: TENANT_ID },
      { id: 'demo-jobcard-004', maintenanceId: 'demo-maint-006', technician: 'Viktor Petrov', estimatedHours: 4, actualHours: 5, laborCost: 400, partsCost: 800, totalCost: 1200, status: 'closed', notes: 'Full electrical system check passed.', tenantId: TENANT_ID },
    ] })
    console.log('[SEED] ✓ Job Cards (4)')

    // 17. SPARE PARTS (10)
    await db.sparePart.createMany({ data: [
      { id: 'demo-part-001', name: 'Oil Filter', partNumber: 'OF-TY-001', category: 'engine', quantityInStock: 45, reorderLevel: 10, unitCost: 12, sellingPrice: 18, supplier: 'Toyota Genuine Parts', location: 'Warehouse A - Shelf 1', tenantId: TENANT_ID },
      { id: 'demo-part-002', name: 'Brake Pads (Front Set)', partNumber: 'BP-FD-002', category: 'brakes', quantityInStock: 22, reorderLevel: 5, unitCost: 45, sellingPrice: 65, supplier: 'Brembo Middle East', location: 'Warehouse A - Shelf 3', tenantId: TENANT_ID },
      { id: 'demo-part-003', name: 'Tire - 225/65R17', partNumber: 'TR-MI-003', category: 'tires', quantityInStock: 16, reorderLevel: 8, unitCost: 120, sellingPrice: 180, supplier: 'Michelin Distribution', location: 'Warehouse B - Tire Rack', tenantId: TENANT_ID },
      { id: 'demo-part-004', name: 'Air Filter', partNumber: 'AF-BMW-004', category: 'engine', quantityInStock: 30, reorderLevel: 8, unitCost: 25, sellingPrice: 38, supplier: 'BMW Genuine Parts', location: 'Warehouse A - Shelf 1', tenantId: TENANT_ID },
      { id: 'demo-part-005', name: 'Radiator Hose', partNumber: 'RH-TY-005', category: 'engine', quantityInStock: 8, reorderLevel: 5, unitCost: 35, sellingPrice: 55, supplier: 'Toyota Genuine Parts', location: 'Warehouse A - Shelf 2', tenantId: TENANT_ID },
      { id: 'demo-part-006', name: 'Alternator', partNumber: 'ALT-CH-006', category: 'electrical', quantityInStock: 4, reorderLevel: 3, unitCost: 450, sellingPrice: 650, supplier: 'Delco Remy Distributor', location: 'Warehouse A - Shelf 5', tenantId: TENANT_ID },
      { id: 'demo-part-007', name: 'Car Battery 12V', partNumber: 'BAT-STD-007', category: 'electrical', quantityInStock: 12, reorderLevel: 5, unitCost: 85, sellingPrice: 130, supplier: 'AC Delco Middle East', location: 'Warehouse A - Battery Rack', tenantId: TENANT_ID },
      { id: 'demo-part-008', name: 'Cabin Air Filter', partNumber: 'CAF-UNI-008', category: 'engine', quantityInStock: 35, reorderLevel: 10, unitCost: 15, sellingPrice: 25, supplier: 'Mann-Filter UAE', location: 'Warehouse A - Shelf 1', tenantId: TENANT_ID },
      { id: 'demo-part-009', name: 'Wiper Blade Set', partNumber: 'WB-UNI-009', category: 'body', quantityInStock: 50, reorderLevel: 15, unitCost: 18, sellingPrice: 28, supplier: 'Bosch Auto Parts', location: 'Warehouse A - Shelf 4', tenantId: TENANT_ID },
      { id: 'demo-part-010', name: 'Transmission Fluid 1L', partNumber: 'TF-DEX-010', category: 'engine', quantityInStock: 60, reorderLevel: 20, unitCost: 14, sellingPrice: 22, supplier: 'Castrol Lubricants', location: 'Warehouse A - Fluid Section', tenantId: TENANT_ID },
    ] })
    console.log('[SEED] ✓ Spare Parts (10)')

    // 18. MAINTENANCE SPARE PARTS (5)
    await db.maintenanceSparePart.createMany({ data: [
      { id: 'demo-msp-001', maintenanceId: 'demo-maint-002', sparePartId: 'demo-part-001', quantity: 1, cost: 12 },
      { id: 'demo-msp-002', maintenanceId: 'demo-maint-002', sparePartId: 'demo-part-008', quantity: 1, cost: 15 },
      { id: 'demo-msp-003', maintenanceId: 'demo-maint-001', sparePartId: 'demo-part-005', quantity: 2, cost: 70 },
      { id: 'demo-msp-004', maintenanceId: 'demo-maint-004', sparePartId: 'demo-part-003', quantity: 2, cost: 240 },
      { id: 'demo-msp-005', maintenanceId: 'demo-maint-006', sparePartId: 'demo-part-006', quantity: 1, cost: 450 },
    ] })
    console.log('[SEED] ✓ Maintenance Spare Parts (5)')

    // 19. PURCHASE ORDERS (3)
    const purchaseOrdersData = [
      { id: 'demo-po-001', orderNumber: 'PO-400001', supplier: 'Toyota Genuine Parts', totalAmount: 850, status: 'received', orderedDate: daysAgo(20), receivedDate: daysAgo(15), notes: 'Monthly restock order', tenantId: TENANT_ID },
      { id: 'demo-po-002', orderNumber: 'PO-400002', supplier: 'Brembo Middle East', totalAmount: 1350, status: 'ordered', orderedDate: daysAgo(5), notes: 'Brake pad restock', tenantId: TENANT_ID },
      { id: 'demo-po-003', orderNumber: 'PO-400003', supplier: 'AC Delco Middle East', totalAmount: 2550, status: 'pending', notes: 'Battery and alternator bulk order', tenantId: TENANT_ID },
    ]
    for (const p of purchaseOrdersData) {
      await db.purchaseOrder.create({ data: p })
    }
    console.log('[SEED] ✓ Purchase Orders (3)')

    // 20. PURCHASE ORDER ITEMS (6)
    await db.purchaseOrderItem.createMany({ data: [
      { id: 'demo-poi-001', purchaseOrderId: 'demo-po-001', sparePartId: 'demo-part-001', partName: 'Oil Filter', quantity: 20, unitCost: 12, totalCost: 240 },
      { id: 'demo-poi-002', purchaseOrderId: 'demo-po-001', sparePartId: 'demo-part-005', partName: 'Radiator Hose', quantity: 10, unitCost: 35, totalCost: 350 },
      { id: 'demo-poi-003', purchaseOrderId: 'demo-po-001', sparePartId: 'demo-part-008', partName: 'Cabin Air Filter', quantity: 10, unitCost: 15, totalCost: 150 },
      { id: 'demo-poi-004', purchaseOrderId: 'demo-po-001', sparePartId: 'demo-part-010', partName: 'Transmission Fluid 1L', quantity: 5, unitCost: 14, totalCost: 70 },
      { id: 'demo-poi-005', purchaseOrderId: 'demo-po-002', sparePartId: 'demo-part-002', partName: 'Brake Pads (Front Set)', quantity: 20, unitCost: 45, totalCost: 900 },
      { id: 'demo-poi-006', purchaseOrderId: 'demo-po-003', sparePartId: 'demo-part-006', partName: 'Alternator', quantity: 3, unitCost: 450, totalCost: 1350 },
    ] })
    console.log('[SEED] ✓ Purchase Order Items (6)')

    // 21. VEHICLE INSPECTIONS (5)
    const inspectionsData = [
      { id: 'demo-insp-001', vehicleId: 'demo-vehicle-001', inspectionDate: daysAgo(15), inspector: 'Sam Perera', type: 'routine', overallCondition: 'excellent', exteriorCondition: 'excellent', interiorCondition: 'excellent', engineCondition: 'excellent', tireCondition: 'good', brakesCondition: 'excellent', notes: 'Vehicle in superb condition', status: 'passed', nextInspectionDate: daysFromNow(75), tenantId: TENANT_ID },
      { id: 'demo-insp-002', vehicleId: 'demo-vehicle-002', inspectionDate: daysAgo(5), inspector: 'Ahmed Salah', type: 'pre_rental', overallCondition: 'good', exteriorCondition: 'good', interiorCondition: 'excellent', engineCondition: 'good', tireCondition: 'good', brakesCondition: 'good', notes: 'Minor scratch on rear bumper noted', issues: 'Minor scratch on rear bumper', status: 'conditional', nextInspectionDate: daysFromNow(30), tenantId: TENANT_ID },
      { id: 'demo-insp-003', vehicleId: 'demo-vehicle-009', inspectionDate: daysAgo(1), inspector: 'Raju Kumar', type: 'pre_rental', overallCondition: 'excellent', exteriorCondition: 'excellent', interiorCondition: 'excellent', engineCondition: 'excellent', tireCondition: 'excellent', brakesCondition: 'excellent', notes: 'Brand new vehicle, all systems perfect', status: 'passed', nextInspectionDate: daysFromNow(90), tenantId: TENANT_ID },
      { id: 'demo-insp-004', vehicleId: 'demo-vehicle-007', inspectionDate: daysAgo(3), inspector: 'Viktor Petrov', type: 'routine', overallCondition: 'fair', exteriorCondition: 'good', interiorCondition: 'fair', engineCondition: 'poor', tireCondition: 'fair', brakesCondition: 'good', notes: 'Engine issue requires immediate attention', issues: 'Engine overheating, coolant leak', status: 'failed', nextInspectionDate: daysFromNow(7), tenantId: TENANT_ID },
      { id: 'demo-insp-005', vehicleId: 'demo-vehicle-012', inspectionDate: daysAgo(7), inspector: 'Sam Perera', type: 'post_rental', overallCondition: 'good', exteriorCondition: 'good', interiorCondition: 'good', engineCondition: 'good', tireCondition: 'fair', brakesCondition: 'good', notes: 'Tires showing wear', issues: 'Rear tire wear pattern', status: 'conditional', nextInspectionDate: daysFromNow(45), tenantId: TENANT_ID },
    ]
    for (const i of inspectionsData) {
      await db.vehicleInspection.create({ data: i })
    }
    console.log('[SEED] ✓ Vehicle Inspections (5)')

    // 22. EXPENSES (8)
    await db.expense.createMany({ data: [
      { id: 'demo-exp-001', category: 'fuel', amount: 4200, date: daysAgo(1), description: 'Monthly fleet fuel purchase - 14 vehicles', vendor: 'Emarat Fuel Station', receiptNumber: 'RCP-FUEL-001', status: 'completed', paymentMethod: 'fleet_card', tenantId: TENANT_ID },
      { id: 'demo-exp-002', category: 'maintenance', amount: 2130, date: daysAgo(3), description: 'Workshop repairs - alternator, tire, brake service', vendor: 'Various Auto Workshops', receiptNumber: 'RCP-MAINT-001', status: 'completed', paymentMethod: 'bank_transfer', tenantId: TENANT_ID },
      { id: 'demo-exp-003', category: 'insurance', amount: 8500, date: daysAgo(10), description: 'Quarterly insurance premium - fleet coverage', vendor: 'Oman Insurance Company', receiptNumber: 'RCP-INS-001', status: 'completed', paymentMethod: 'bank_transfer', tenantId: TENANT_ID },
      { id: 'demo-exp-004', category: 'salary', amount: 45000, date: daysAgo(5), description: 'Monthly driver salaries - 8 drivers', vendor: 'Internal Payroll', receiptNumber: 'RCP-SAL-001', status: 'completed', paymentMethod: 'bank_transfer', tenantId: TENANT_ID },
      { id: 'demo-exp-005', category: 'rent', amount: 28000, date: daysAgo(15), description: 'Office and warehouse rent - monthly', vendor: 'Dubai Properties', receiptNumber: 'RCP-RENT-001', status: 'completed', paymentMethod: 'bank_transfer', tenantId: TENANT_ID },
      { id: 'demo-exp-006', category: 'utilities', amount: 3500, date: daysAgo(12), description: 'Electricity, water, internet', vendor: 'DEWA & Du Telecom', receiptNumber: 'RCP-UTIL-001', status: 'completed', paymentMethod: 'bank_transfer', tenantId: TENANT_ID },
      { id: 'demo-exp-007', category: 'fuel', amount: 1850, date: daysAgo(8), description: 'Emergency fuel refill for long-haul trips', vendor: 'ADNOC Fuel Station', receiptNumber: 'RCP-FUEL-002', status: 'completed', paymentMethod: 'fleet_card', tenantId: TENANT_ID },
      { id: 'demo-exp-008', category: 'other', amount: 1200, date: daysAgo(20), description: 'Vehicle washing and detailing - fleet wide', vendor: 'AutoSpa Dubai', receiptNumber: 'RCP-OTH-001', status: 'completed', paymentMethod: 'cash', tenantId: TENANT_ID },
    ] })
    console.log('[SEED] ✓ Expenses (8)')

    // 23. INVOICES (5)
    const invoicesData = [
      { id: 'demo-inv-001', invoiceNumber: 'INV-500001', customerId: 'demo-cust-001', issueDate: daysAgo(5), dueDate: daysAgo(2), subtotal: 450, taxAmount: 22.5, totalAmount: 472.5, paidAmount: 472.5, status: 'paid', paidDate: daysAgo(2), notes: 'BMW X5 3-day rental', tenantId: TENANT_ID },
      { id: 'demo-inv-002', invoiceNumber: 'INV-500002', customerId: 'demo-cust-003', issueDate: daysAgo(3), dueDate: daysFromNow(12), subtotal: 910, taxAmount: 45.5, totalAmount: 955.5, paidAmount: 300, status: 'partial', notes: 'Nissan Patrol weekly rental', tenantId: TENANT_ID },
      { id: 'demo-inv-003', invoiceNumber: 'INV-500003', customerId: 'demo-cust-005', issueDate: daysAgo(1), dueDate: daysFromNow(14), subtotal: 600, taxAmount: 30, totalAmount: 630, paidAmount: 0, status: 'sent', notes: 'Audi A6 luxury rental', tenantId: TENANT_ID },
      { id: 'demo-inv-004', invoiceNumber: 'INV-500004', customerId: 'demo-cust-009', issueDate: daysAgo(10), dueDate: daysAgo(3), subtotal: 385, taxAmount: 19.25, totalAmount: 404.25, paidAmount: 0, status: 'overdue', notes: 'Toyota Camry rental + bumper damage repair', tenantId: TENANT_ID },
      { id: 'demo-inv-005', invoiceNumber: 'INV-500005', customerId: 'demo-cust-008', issueDate: daysAgo(20), dueDate: daysAgo(15), subtotal: 360, taxAmount: 18, totalAmount: 378, paidAmount: 378, status: 'paid', paidDate: daysAgo(16), notes: 'Mercedes E-Class rental', tenantId: TENANT_ID },
    ]
    for (const i of invoicesData) {
      await db.invoice.create({ data: i })
    }
    console.log('[SEED] ✓ Invoices (5)')

    // 24. INVOICE ITEMS (10)
    await db.invoiceItem.createMany({ data: [
      { id: 'demo-invitem-001', invoiceId: 'demo-inv-001', description: 'BMW X5 Daily Rental (3 days)', quantity: 3, unitPrice: 150, total: 450 },
      { id: 'demo-invitem-002', invoiceId: 'demo-inv-001', description: 'VAT (5%)', quantity: 1, unitPrice: 22.5, total: 22.5 },
      { id: 'demo-invitem-003', invoiceId: 'demo-inv-002', description: 'Nissan Patrol Daily Rental (7 days)', quantity: 7, unitPrice: 130, total: 910 },
      { id: 'demo-invitem-004', invoiceId: 'demo-inv-003', description: 'Audi A6 Daily Rental (3 days)', quantity: 3, unitPrice: 200, total: 600 },
      { id: 'demo-invitem-005', invoiceId: 'demo-inv-004', description: 'Toyota Camry Daily Rental (3 days)', quantity: 3, unitPrice: 45, total: 135 },
      { id: 'demo-invitem-006', invoiceId: 'demo-inv-004', description: 'Bumper Damage Repair Charge', quantity: 1, unitPrice: 250, total: 250 },
      { id: 'demo-invitem-007', invoiceId: 'demo-inv-005', description: 'Mercedes E-Class Daily Rental (2 days)', quantity: 2, unitPrice: 180, total: 360 },
      { id: 'demo-invitem-008', invoiceId: 'demo-inv-002', description: 'VAT (5%)', quantity: 1, unitPrice: 45.5, total: 45.5 },
      { id: 'demo-invitem-009', invoiceId: 'demo-inv-003', description: 'VAT (5%)', quantity: 1, unitPrice: 30, total: 30 },
      { id: 'demo-invitem-010', invoiceId: 'demo-inv-004', description: 'VAT (5%)', quantity: 1, unitPrice: 19.25, total: 19.25 },
    ] })
    console.log('[SEED] ✓ Invoice Items (10)')

    // 25. PAYMENTS (4)
    await db.payment.createMany({ data: [
      { id: 'demo-payment-001', invoiceId: 'demo-inv-001', amount: 472.5, method: 'credit_card', reference: 'PAY-CC-001', paidDate: daysAgo(2), status: 'completed', notes: 'Full payment via credit card', tenantId: TENANT_ID },
      { id: 'demo-payment-002', invoiceId: 'demo-inv-002', amount: 300, method: 'bank_transfer', reference: 'PAY-BT-002', paidDate: daysAgo(3), status: 'completed', notes: 'Deposit payment via wire transfer', tenantId: TENANT_ID },
      { id: 'demo-payment-003', invoiceId: 'demo-inv-005', amount: 378, method: 'bank_transfer', reference: 'PAY-BT-003', paidDate: daysAgo(16), status: 'completed', notes: 'Full payment received', tenantId: TENANT_ID },
      { id: 'demo-payment-004', amount: 150, method: 'cash', reference: 'PAY-CSH-004', paidDate: daysAgo(5), status: 'completed', notes: 'Cash deposit for security', tenantId: TENANT_ID },
    ] })
    console.log('[SEED] ✓ Payments (4)')

    // 26. JOURNAL ENTRIES (6)
    await db.journalEntry.createMany({ data: [
      { id: 'demo-je-001', entryNumber: 'JE-600001', date: daysAgo(2), description: 'Rental income - BMW X5', account: 'Rental Income', debitAmount: 0, creditAmount: 472.5, amount: 472.5, type: 'credit', reference: 'INV-500001', status: 'posted', tenantId: TENANT_ID },
      { id: 'demo-je-002', entryNumber: 'JE-600002', date: daysAgo(2), description: 'Cash receipt - BMW X5 rental', account: 'Accounts Receivable', debitAmount: 472.5, creditAmount: 0, amount: 472.5, type: 'debit', reference: 'INV-500001', status: 'posted', tenantId: TENANT_ID },
      { id: 'demo-je-003', entryNumber: 'JE-600003', date: daysAgo(5), description: 'Fuel expense - monthly fleet', account: 'Fuel Expense', debitAmount: 4200, creditAmount: 0, amount: 4200, type: 'debit', reference: 'RCP-FUEL-001', status: 'posted', tenantId: TENANT_ID },
      { id: 'demo-je-004', entryNumber: 'JE-600004', date: daysAgo(5), description: 'Cash payment - fuel expense', account: 'Cash', debitAmount: 0, creditAmount: 4200, amount: 4200, type: 'credit', reference: 'RCP-FUEL-001', status: 'posted', tenantId: TENANT_ID },
      { id: 'demo-je-005', entryNumber: 'JE-600005', date: daysAgo(10), description: 'Insurance premium payment', account: 'Insurance Expense', debitAmount: 8500, creditAmount: 0, amount: 8500, type: 'debit', reference: 'RCP-INS-001', status: 'posted', tenantId: TENANT_ID },
      { id: 'demo-je-006', entryNumber: 'JE-600006', date: daysAgo(10), description: 'Bank payment - insurance', account: 'Bank', debitAmount: 0, creditAmount: 8500, amount: 8500, type: 'credit', reference: 'RCP-INS-001', status: 'posted', tenantId: TENANT_ID },
    ] })
    console.log('[SEED] ✓ Journal Entries (6)')

    // 27. INSURANCE POLICIES (5)
    const insuranceData = [
      { id: 'demo-ins-001', vehicleId: 'demo-vehicle-002', policyNumber: 'INS-OC-2024-001', provider: 'Oman Insurance Company', type: 'comprehensive', premium: 4500, startDate: daysAgo(180), endDate: daysFromNow(185), coverage: 'Full comprehensive coverage including third party, fire, theft, and natural perils.', deductible: 500, status: 'active', notes: 'Renewal due in 6 months', tenantId: TENANT_ID },
      { id: 'demo-ins-002', vehicleId: 'demo-vehicle-005', policyNumber: 'INS-OC-2024-002', provider: 'Oman Insurance Company', type: 'comprehensive', premium: 3800, startDate: daysAgo(150), endDate: daysFromNow(215), coverage: 'Comprehensive coverage with off-road extension', deductible: 750, status: 'active', notes: 'Includes desert driving coverage', tenantId: TENANT_ID },
      { id: 'demo-ins-003', vehicleId: 'demo-vehicle-009', policyNumber: 'INS-AX-2024-003', provider: 'AXA Gulf Insurance', type: 'comprehensive', premium: 6200, startDate: daysAgo(60), endDate: daysFromNow(305), coverage: 'Premium comprehensive for luxury vehicles. Zero excess, courtesy car included.', deductible: 0, status: 'active', notes: 'Luxury vehicle premium policy', tenantId: TENANT_ID },
      { id: 'demo-ins-004', vehicleId: 'demo-vehicle-007', policyNumber: 'INS-OC-2023-004', provider: 'Oman Insurance Company', type: 'third_party', premium: 1800, startDate: daysAgo(300), endDate: daysFromNow(65), coverage: 'Third party liability only.', deductible: 1000, status: 'active', notes: 'Due for upgrade upon renewal', tenantId: TENANT_ID },
      { id: 'demo-ins-005', vehicleId: 'demo-vehicle-012', policyNumber: 'INS-NI-2024-005', provider: 'Noor Takaful Insurance', type: 'comprehensive', premium: 5200, startDate: daysAgo(90), endDate: daysFromNow(275), coverage: 'Comprehensive commercial vehicle coverage. Passenger liability included.', deductible: 500, status: 'active', notes: 'Commercial vehicle policy', tenantId: TENANT_ID },
    ]
    for (const i of insuranceData) {
      await db.insurancePolicy.create({ data: i })
    }
    console.log('[SEED] ✓ Insurance Policies (5)')

    // 28. EMPLOYEES (6)
    await db.employee.createMany({ data: [
      { id: 'demo-emp-001', employeeId: 'EMP-001', firstName: 'Ahmed', lastName: 'Al-Maktoum', email: 'ahmed.maktoum@fleetflow.os', phone: '+971-50-500-1001', department: 'operations', position: 'Operations Manager', hireDate: daysAgo(1460), salary: 18000, status: 'active', address: 'Dubai Hills Estate', emergencyContact: '+971-50-500-1002', notes: 'Senior manager, 4 years tenure', tenantId: TENANT_ID },
      { id: 'demo-emp-002', employeeId: 'EMP-002', firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma@fleetflow.os', phone: '+971-55-600-2002', department: 'finance', position: 'Senior Accountant', hireDate: daysAgo(1095), salary: 14000, status: 'active', address: 'Karama, Dubai', emergencyContact: '+971-55-600-2003', notes: 'Handles fleet billing and invoicing', tenantId: TENANT_ID },
      { id: 'demo-emp-003', employeeId: 'EMP-003', firstName: 'Marco', lastName: 'Rossi', email: 'marco.rossi@fleetflow.os', phone: '+971-50-700-3003', department: 'maintenance', position: 'Workshop Supervisor', hireDate: daysAgo(730), salary: 12000, status: 'active', address: 'Al Quoz, Dubai', emergencyContact: '+971-50-700-3004', notes: 'Oversees vehicle maintenance', tenantId: TENANT_ID },
      { id: 'demo-emp-004', employeeId: 'EMP-004', firstName: 'Fatima', lastName: 'Al-Zahra', email: 'fatima.zahra@fleetflow.os', phone: '+971-55-800-4004', department: 'hr', position: 'HR Coordinator', hireDate: daysAgo(540), salary: 11000, status: 'active', address: 'JLT, Dubai', emergencyContact: '+971-55-800-4005', notes: 'Manages driver recruitment', tenantId: TENANT_ID },
      { id: 'demo-emp-005', employeeId: 'EMP-005', firstName: 'Tom', lastName: 'Anderson', email: 'tom.anderson@fleetflow.os', phone: '+971-50-900-5005', department: 'dispatch', position: 'Dispatch Coordinator', hireDate: daysAgo(365), salary: 10000, status: 'on_leave', address: 'Dubai Marina', emergencyContact: '+971-50-900-5006', notes: 'On annual leave', tenantId: TENANT_ID },
      { id: 'demo-emp-006', employeeId: 'EMP-006', firstName: 'Sara', lastName: 'Al-Sayed', email: 'sara.sayed@fleetflow.os', phone: '+971-55-100-6006', department: 'admin', position: 'Office Administrator', hireDate: daysAgo(900), salary: 9500, status: 'active', address: 'Al Barsha, Dubai', emergencyContact: '+971-55-100-6007', notes: 'Manages office operations', tenantId: TENANT_ID },
    ] })
    console.log('[SEED] ✓ Employees (6)')

    // 29. ATTENDANCE (15)
    await db.attendance.createMany({ data: [
      { id: 'demo-att-001', employeeId: 'demo-emp-001', date: daysAgo(0), checkIn: hoursAgo(8), hoursWorked: 8, status: 'present' },
      { id: 'demo-att-002', employeeId: 'demo-emp-001', date: daysAgo(1), checkIn: daysAgo(1), checkOut: daysAgo(1), hoursWorked: 9, status: 'present', notes: 'Worked late on monthly report' },
      { id: 'demo-att-003', employeeId: 'demo-emp-002', date: daysAgo(0), checkIn: hoursAgo(7), hoursWorked: 7, status: 'present' },
      { id: 'demo-att-004', employeeId: 'demo-emp-002', date: daysAgo(1), checkIn: daysAgo(1), checkOut: daysAgo(1), hoursWorked: 8, status: 'present' },
      { id: 'demo-att-005', employeeId: 'demo-emp-003', date: daysAgo(0), checkIn: hoursAgo(9), hoursWorked: 9, status: 'late', notes: 'Arrived 30 minutes late' },
      { id: 'demo-att-006', employeeId: 'demo-emp-003', date: daysAgo(1), checkIn: daysAgo(1), checkOut: daysAgo(1), hoursWorked: 8, status: 'present' },
      { id: 'demo-att-007', employeeId: 'demo-emp-004', date: daysAgo(0), checkIn: hoursAgo(8), hoursWorked: 8, status: 'present' },
      { id: 'demo-att-008', employeeId: 'demo-emp-004', date: daysAgo(2), hoursWorked: 0, status: 'absent', notes: 'Sick day' },
      { id: 'demo-att-009', employeeId: 'demo-emp-005', date: daysAgo(0), hoursWorked: 0, status: 'leave', notes: 'Annual leave' },
      { id: 'demo-att-010', employeeId: 'demo-emp-005', date: daysAgo(1), hoursWorked: 0, status: 'leave', notes: 'Annual leave' },
      { id: 'demo-att-011', employeeId: 'demo-emp-006', date: daysAgo(0), checkIn: hoursAgo(8), hoursWorked: 8, status: 'present' },
      { id: 'demo-att-012', employeeId: 'demo-emp-006', date: daysAgo(1), checkIn: daysAgo(1), checkOut: daysAgo(1), hoursWorked: 8, status: 'present' },
      { id: 'demo-att-013', employeeId: 'demo-emp-001', date: daysAgo(3), checkIn: daysAgo(3), checkOut: daysAgo(3), hoursWorked: 8, status: 'present' },
      { id: 'demo-att-014', employeeId: 'demo-emp-002', date: daysAgo(3), checkIn: daysAgo(3), checkOut: daysAgo(3), hoursWorked: 4, status: 'half_day', notes: 'Left early for personal reasons' },
      { id: 'demo-att-015', employeeId: 'demo-emp-003', date: daysAgo(3), checkIn: daysAgo(3), checkOut: daysAgo(3), hoursWorked: 10, status: 'present', notes: 'Overtime for urgent repair' },
    ] })
    console.log('[SEED] ✓ Attendance (15)')

    // 30. LEAVE RECORDS (3)
    await db.leaveRecord.createMany({ data: [
      { id: 'demo-leave-001', employeeId: 'demo-emp-005', type: 'annual', startDate: daysAgo(3), endDate: daysFromNow(4), days: 7, status: 'approved', reason: 'Family vacation', approvedBy: 'Ahmed Al-Maktoum' },
      { id: 'demo-leave-002', employeeId: 'demo-emp-004', type: 'sick', startDate: daysAgo(2), endDate: daysAgo(1), days: 2, status: 'approved', reason: 'Medical appointment', approvedBy: 'Ahmed Al-Maktoum' },
      { id: 'demo-leave-003', employeeId: 'demo-emp-003', type: 'personal', startDate: daysFromNow(10), endDate: daysFromNow(11), days: 2, status: 'pending', reason: 'Personal matters' },
    ] })
    console.log('[SEED] ✓ Leave Records (3)')

    // 31. COMPLIANCE RECORDS (4)
    const complianceData = [
      { id: 'demo-comp-001', vehicleId: 'demo-vehicle-002', type: 'registration', documentNumber: 'REG-DXB-2024-67890', issueDate: daysAgo(100), expiryDate: daysFromNow(265), issuingAuthority: 'RTA Dubai', status: 'valid', notes: 'Annual vehicle registration', tenantId: TENANT_ID },
      { id: 'demo-comp-002', vehicleId: 'demo-vehicle-007', type: 'inspection', documentNumber: 'INS-DXB-2024-44444', issueDate: daysAgo(180), expiryDate: daysFromNow(5), issuingAuthority: 'RTA Dubai Vehicle Testing', status: 'renewal_required', notes: 'Inspection expiring soon', tenantId: TENANT_ID },
      { id: 'demo-comp-003', vehicleId: 'demo-vehicle-012', type: 'permit', documentNumber: 'PERM-RTA-2024-BUS01', issueDate: daysAgo(200), expiryDate: daysFromNow(165), issuingAuthority: 'RTA Dubai Public Transport', status: 'valid', notes: 'Commercial bus operation permit', tenantId: TENANT_ID },
      { id: 'demo-comp-004', vehicleId: 'demo-vehicle-009', type: 'certification', documentNumber: 'CERT-LUX-2024-009', issueDate: daysAgo(60), expiryDate: daysFromNow(305), issuingAuthority: 'Dubai Luxury Vehicle Registry', status: 'valid', notes: 'Luxury vehicle certification', tenantId: TENANT_ID },
    ]
    for (const c of complianceData) {
      await db.complianceRecord.create({ data: c })
    }
    console.log('[SEED] ✓ Compliance Records (4)')

    // 32. DOCUMENTS (5)
    await db.document.createMany({ data: [
      { id: 'demo-doc-001', title: 'Rental Agreement Template 2024', type: 'contract', category: 'legal', fileName: 'rental_agreement_template_2024.pdf', fileUrl: '/documents/templates/rental_agreement_2024.pdf', fileSize: 245000, relatedEntity: 'system', relatedEntityId: 'template', uploadedBy: 'admin@apexflow.cloud', status: 'active', notes: 'Updated for 2024 legal requirements', tenantId: TENANT_ID },
      { id: 'demo-doc-002', title: 'Vehicle Handover Checklist', type: 'inspection', category: 'operations', fileName: 'vehicle_handover_checklist.pdf', fileUrl: '/documents/checklists/handover_checklist.pdf', fileSize: 85000, relatedEntity: 'system', relatedEntityId: 'template', uploadedBy: 'ahmed.maktoum@fleetflow.os', status: 'active', notes: 'Pre and post rental checklist', tenantId: TENANT_ID },
      { id: 'demo-doc-003', title: 'Insurance Policy - BMW X5', type: 'insurance', category: 'vehicle', fileName: 'insurance_BMW_X5_2024.pdf', fileUrl: '/documents/insurance/ins_oc_2024_001.pdf', fileSize: 520000, relatedEntity: 'vehicle', relatedEntityId: 'demo-vehicle-002', uploadedBy: 'priya.sharma@fleetflow.os', status: 'active', notes: 'Current comprehensive insurance', tenantId: TENANT_ID },
      { id: 'demo-doc-004', title: 'Employee Handbook 2024', type: 'other', category: 'hr', fileName: 'employee_handbook_2024.pdf', fileUrl: '/documents/hr/employee_handbook_2024.pdf', fileSize: 1200000, relatedEntity: 'system', relatedEntityId: 'template', uploadedBy: 'fatima.zahra@fleetflow.os', status: 'active', notes: 'Company policies and procedures', tenantId: TENANT_ID },
      { id: 'demo-doc-005', title: 'Invoice INV-500001', type: 'invoice', category: 'finance', fileName: 'invoice_INV-500001.pdf', fileUrl: '/documents/invoices/inv_500001.pdf', fileSize: 95000, relatedEntity: 'invoice', relatedEntityId: 'demo-inv-001', uploadedBy: 'priya.sharma@fleetflow.os', status: 'active', notes: 'Paid invoice for BMW X5 rental', tenantId: TENANT_ID },
    ] })
    console.log('[SEED] ✓ Documents (5)')

    // 33. FUEL RECORDS (8)
    const fuelRecordsData = [
      { id: 'demo-fuel-001', vehicleId: 'demo-vehicle-002', driverId: 'demo-driver-001', date: daysAgo(1), fuelType: 'diesel', quantity: 65, unitPrice: 3.15, totalCost: 204.75, odometer: 8500, station: 'Emarat - Sheikh Zayed Road', receiptNumber: 'FUE-001', status: 'completed', notes: 'Full tank refill', tenantId: TENANT_ID },
      { id: 'demo-fuel-002', vehicleId: 'demo-vehicle-005', driverId: 'demo-driver-003', date: daysAgo(2), fuelType: 'petrol', quantity: 80, unitPrice: 2.95, totalCost: 236, odometer: 32100, station: 'ADNOC - Abu Dhabi Road', receiptNumber: 'FUE-002', status: 'completed', notes: 'Long trip refuel', tenantId: TENANT_ID, tripId: 'demo-trip-001' },
      { id: 'demo-fuel-003', vehicleId: 'demo-vehicle-008', driverId: 'demo-driver-008', date: daysAgo(1), fuelType: 'diesel', quantity: 55, unitPrice: 3.15, totalCost: 173.25, odometer: 41800, station: 'Emarat - Airport Road', receiptNumber: 'FUE-003', status: 'completed', notes: 'Airport shuttle refuel', tenantId: TENANT_ID, tripId: 'demo-trip-005' },
      { id: 'demo-fuel-004', vehicleId: 'demo-vehicle-009', driverId: 'demo-driver-005', date: daysAgo(0), fuelType: 'petrol', quantity: 45, unitPrice: 2.95, totalCost: 132.75, odometer: 3500, station: 'Emarat - Business Bay', receiptNumber: 'FUE-004', status: 'completed', notes: 'VIP vehicle refuel', tenantId: TENANT_ID, tripId: 'demo-trip-008' },
      { id: 'demo-fuel-005', vehicleId: 'demo-vehicle-012', driverId: 'demo-driver-008', date: daysAgo(4), fuelType: 'diesel', quantity: 90, unitPrice: 3.15, totalCost: 283.5, odometer: 99000, station: 'ADNOC - Al Barsha', receiptNumber: 'FUE-005', status: 'completed', notes: 'Bus refuel', tenantId: TENANT_ID, tripId: 'demo-trip-006' },
      { id: 'demo-fuel-006', vehicleId: 'demo-vehicle-014', driverId: 'demo-driver-001', date: daysAgo(6), fuelType: 'petrol', quantity: 70, unitPrice: 2.95, totalCost: 206.5, odometer: 73800, station: 'Emarat - Investment Park', receiptNumber: 'FUE-006', status: 'completed', notes: 'Truck refuel', tenantId: TENANT_ID, tripId: 'demo-trip-007' },
      { id: 'demo-fuel-007', vehicleId: 'demo-vehicle-001', driverId: 'demo-driver-002', date: daysAgo(10), fuelType: 'petrol', quantity: 40, unitPrice: 2.95, totalCost: 118, odometer: 24800, station: 'Emarat - Deira', receiptNumber: 'FUE-007', status: 'completed', notes: 'Economy sedan refuel', tenantId: TENANT_ID },
      { id: 'demo-fuel-008', vehicleId: 'demo-vehicle-004', date: daysAgo(7), fuelType: 'diesel', quantity: 60, unitPrice: 3.15, totalCost: 189, odometer: 62600, station: 'ADNOC - Jebel Ali', receiptNumber: 'FUE-008', status: 'completed', notes: 'Van fleet refuel', tenantId: TENANT_ID },
    ]
    for (const f of fuelRecordsData) {
      await db.fuelRecord.create({ data: f })
    }
    console.log('[SEED] ✓ Fuel Records (8)')

    // 34. REVENUE (10)
    await db.revenue.createMany({ data: [
      { id: 'demo-rev-001', category: 'rental', amount: 2850, currency: 'USD', clientId: CLIENT_ID, description: 'Weekly rental income - various vehicles', date: daysAgo(1) },
      { id: 'demo-rev-002', category: 'rental', amount: 4200, currency: 'USD', clientId: CLIENT_ID, description: 'Luxury vehicle rental income', date: daysAgo(3) },
      { id: 'demo-rev-003', category: 'subscription', amount: 1500, currency: 'USD', clientId: CLIENT_ID, description: 'Monthly platform subscription', date: daysAgo(5) },
      { id: 'demo-rev-004', category: 'rental', amount: 1800, currency: 'USD', clientId: CLIENT_ID, description: 'Corporate fleet rental - weekly', date: daysAgo(7) },
      { id: 'demo-rev-005', category: 'other', amount: 450, currency: 'USD', clientId: CLIENT_ID, description: 'Insurance claim recovery', date: daysAgo(8) },
      { id: 'demo-rev-006', category: 'rental', amount: 3200, currency: 'USD', clientId: CLIENT_ID, description: 'Weekend rental surge - SUV category', date: daysAgo(10) },
      { id: 'demo-rev-007', category: 'renewal', amount: 2000, currency: 'USD', clientId: CLIENT_ID, description: 'License renewal revenue', date: daysAgo(12) },
      { id: 'demo-rev-008', category: 'rental', amount: 950, currency: 'USD', clientId: CLIENT_ID, description: 'Economy sedan rentals', date: daysAgo(14) },
      { id: 'demo-rev-009', category: 'rental', amount: 5600, currency: 'USD', clientId: CLIENT_ID, description: 'Monthly van and bus rental contract', date: daysAgo(18) },
      { id: 'demo-rev-010', category: 'other', amount: 750, currency: 'USD', clientId: CLIENT_ID, description: 'Damage recovery charges', date: daysAgo(20) },
    ] })
    console.log('[SEED] ✓ Revenue (10)')

    // 35. UPDATE RECORDS (2)
    await db.updateRecord.createMany({ data: [
      { id: 'demo-update-001', version: '2.4.0', releaseNotes: 'Major update: New fleet analytics dashboard, GPS tracking improvements, enhanced driver management module.', type: 'major', isCritical: false, forceUpdate: false, status: 'published', publishedAt: daysAgo(15) },
      { id: 'demo-update-002', version: '2.4.1', releaseNotes: 'Patch: Fixed GPS location refresh interval, resolved invoice PDF generation issue, improved search performance.', type: 'patch', isCritical: false, forceUpdate: false, status: 'published', publishedAt: daysAgo(3) },
    ] })
    console.log('[SEED] ✓ Update Records (2)')

    // 36. TENANT SETTINGS (9 categories)
    const tenantSettingsData = [
      { tenantId: TENANT_ID, category: 'general', data: { companyName: 'FleetFlow Demo Corp', logo: '/logo.svg', timezone: 'Asia/Dubai', dateFormat: 'DD/MM/YYYY', timeFormat: '24h', currency: 'AED', language: 'en', phone: '+971-4-XXX-XXXX', email: 'info@fleetflow.os', address: 'Business Bay, Dubai, UAE', taxId: 'TAX-FF-001', website: 'https://fleetflow.os' } },
      { tenantId: TENANT_ID, category: 'receipt', data: { header: 'FleetFlow OS - Rental Receipt', footer: 'Thank you for choosing FleetFlow OS!', showLogo: true, showCompanyInfo: true, showTaxBreakdown: true, receiptPrefix: 'RCP', nextReceiptNumber: 1001, paperSize: 'A4', includeQRCode: true } },
      { tenantId: TENANT_ID, category: 'invoice', data: { header: 'FleetFlow OS - Invoice', footer: 'Payment due within 30 days. Late payments subject to 2% monthly interest.', showLogo: true, showCompanyInfo: true, showTaxBreakdown: true, invoicePrefix: 'INV', nextInvoiceNumber: 500006, paperSize: 'A4', paymentTerms: 'net_30', includeQRCode: true, includeBankDetails: true } },
      { tenantId: TENANT_ID, category: 'payment', data: { defaultPaymentMethod: 'bank_transfer', acceptedMethods: ['cash', 'card', 'bank_transfer', 'cheque', 'online'], autoReceipt: true, latePaymentFee: 2, latePaymentFeeType: 'percentage', partialPaymentAllowed: true, minimumPaymentPercentage: 30 } },
      { tenantId: TENANT_ID, category: 'tax', data: { taxEnabled: true, taxRate: 5, taxType: 'VAT', taxId: 'TAX-FF-001', taxInclusive: false, taxLabel: 'VAT', applyTaxOn: 'subtotal', exemptCategories: [] } },
      { tenantId: TENANT_ID, category: 'email', data: { smtpHost: 'smtp.fleetflow.os', smtpPort: 587, smtpSecure: true, smtpUser: 'noreply@fleetflow.os', fromEmail: 'noreply@fleetflow.os', fromName: 'FleetFlow OS', replyTo: 'support@fleetflow.os', emailFooter: 'Powered by FleetFlow OS' } },
      { tenantId: TENANT_ID, category: 'notification', data: { emailNotifications: true, smsNotifications: true, pushNotifications: true, reservationConfirmation: true, paymentReminder: true, maintenanceAlert: true, insuranceExpiryAlert: true, registrationExpiryAlert: true, dailyReport: true, weeklyDigest: true } },
      { tenantId: TENANT_ID, category: 'security', data: { twoFactorAuth: false, sessionTimeout: 30, passwordMinLength: 8, passwordRequireUppercase: true, passwordRequireNumbers: true, passwordRequireSpecial: false, maxLoginAttempts: 5, lockoutDuration: 15, ipWhitelist: [], requirePasswordChange: 90 } },
      { tenantId: TENANT_ID, category: 'appearance', data: { theme: 'system', primaryColor: '#0a9a8a', accentColor: '#2dd4bf', sidebarStyle: 'glass', cardStyle: 'glass', compactMode: false, fontSize: 'medium', borderRadius: 'rounded', animationEnabled: true } },
    ]
    for (const s of tenantSettingsData) {
      await db.tenantSettings.create({ data: s })
    }
    console.log('[SEED] ✓ Tenant Settings (9)')

    // 37. CLIENT ACTIVITY (3)
    await db.clientActivity.createMany({ data: [
      { id: 'demo-activity-001', clientId: CLIENT_ID, action: 'login', details: 'Admin user logged in from Dubai, UAE', createdAt: daysAgo(0) },
      { id: 'demo-activity-002', clientId: CLIENT_ID, action: 'vehicle_added', details: 'New vehicle Tesla Model 3 (VH-015) added to fleet', createdAt: daysAgo(5) },
      { id: 'demo-activity-003', clientId: CLIENT_ID, action: 'invoice_generated', details: 'Invoice INV-500003 generated for James Williams', createdAt: daysAgo(1) },
    ] })
    console.log('[SEED] ✓ Client Activity (3)')

    // 38. PURCHASE HISTORY (2)
    await db.purchaseHistory.createMany({ data: [
      { id: 'demo-purchase-001', clientId: CLIENT_ID, item: 'Enterprise License - Annual', amount: 12000, currency: 'USD', status: 'completed', purchaseDate: daysAgo(180) },
      { id: 'demo-purchase-002', clientId: CLIENT_ID, item: 'GPS Tracking Module - Add-on', amount: 2500, currency: 'USD', status: 'completed', purchaseDate: daysAgo(90) },
    ] })
    console.log('[SEED] ✓ Purchase History (2)')

    // ============================================
    // COMPLETE
    // ============================================
    console.log('[SEED] ✅ Comprehensive seed completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Comprehensive seed data created successfully',
      stats: {
        tenant: 1, client: 1, users: 2, license: 1,
        vehicles: 15, customers: 12, drivers: 8,
        reservations: 10, rentalContracts: 6, deposits: 4,
        damageReports: 3, dispatchOrders: 5, trips: 8,
        gpsLocations: 20, maintenanceRecords: 6, jobCards: 4,
        spareParts: 10, maintenanceSpareParts: 5,
        purchaseOrders: 3, purchaseOrderItems: 6,
        vehicleInspections: 5, expenses: 8,
        invoices: 5, invoiceItems: 10, payments: 4,
        journalEntries: 6, insurancePolicies: 5,
        employees: 6, attendance: 15, leaveRecords: 3,
        complianceRecords: 4, documents: 5, fuelRecords: 8,
        revenue: 10, updateRecords: 2, tenantSettings: 9,
        clientActivity: 3, purchaseHistory: 2,
      }
    })
  } catch (error) {
    console.error('[SEED] Error:', error)
    return NextResponse.json({
      success: false,
      message: 'Seed failed',
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
