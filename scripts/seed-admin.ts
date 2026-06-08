import { db } from '../src/lib/db'

async function seed() {
  // Check if admin exists
  let admin = await db.user.findUnique({ where: { email: 'admin@apexflow.cloud' } })
  if (!admin) {
    // Check old email
    const oldAdmin = await db.user.findUnique({ where: { email: 'admin@fleetflow.os' } })
    if (oldAdmin) {
      admin = await db.user.update({
        where: { id: oldAdmin.id },
        data: { email: 'admin@apexflow.cloud', password: 'Admin@180H' }
      })
      console.log('Updated old admin:', admin.email)
    } else {
      // Check by role
      const superOwner = await db.user.findFirst({ where: { role: 'super_owner' } })
      if (superOwner) {
        admin = await db.user.update({
          where: { id: superOwner.id },
          data: { email: 'admin@apexflow.cloud', password: 'Admin@180H' }
        })
        console.log('Updated super_owner:', admin.email)
      } else {
        // Create new admin
        const tenant = await db.tenant.findFirst({ where: { status: 'active' } })
        admin = await db.user.create({
          data: {
            email: 'admin@apexflow.cloud',
            password: 'Admin@180H',
            name: 'System Administrator',
            role: 'super_owner',
            status: 'active',
            tenantId: tenant?.id || null,
          }
        })
        console.log('Created new admin:', admin.email)
      }
    }
  } else {
    // Update password
    admin = await db.user.update({
      where: { id: admin.id },
      data: { password: 'Admin@180H' }
    })
    console.log('Updated password for:', admin.email)
  }
  
  // Verify
  const verify = await db.user.findUnique({ where: { email: 'admin@apexflow.cloud' } })
  console.log('Verified:', verify?.email, verify?.role, verify?.status)
  
  // Count tables
  const counts = {
    users: await db.user.count(),
    tenants: await db.tenant.count(),
    vehicles: await db.vehicle.count(),
    customers: await db.customer.count(),
    drivers: await db.driver.count(),
    reservations: await db.reservation.count(),
  }
  console.log('DB Counts:', counts)
  
  await db.$disconnect()
}

seed().catch(e => { console.error(e); process.exit(1) })
