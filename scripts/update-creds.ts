import { db } from '../src/lib/db'

async function updateCredentials() {
  // Find the existing admin user
  const existing = await db.user.findFirst({
    where: { role: 'super_owner' }
  })
  
  if (!existing) {
    console.log('No super_owner found. Trying by email...')
    const byEmail = await db.user.findUnique({
      where: { email: 'admin@fleetflow.os' }
    })
    if (!byEmail) {
      console.log('No admin user found at all! Creating one...')
      const tenant = await db.tenant.findFirst({ where: { status: 'active' } })
      const newUser = await db.user.create({
        data: {
          email: 'admin@apexflow.cloud',
          password: 'Admin@180H',
          name: 'System Administrator',
          role: 'super_owner',
          status: 'active',
          tenantId: tenant?.id || null,
        }
      })
      console.log('Created user:', newUser.email, newUser.name, newUser.role)
    } else {
      const updated = await db.user.update({
        where: { id: byEmail.id },
        data: {
          email: 'admin@apexflow.cloud',
          password: 'Admin@180H',
        }
      })
      console.log('Updated user:', updated.email, updated.name, updated.role)
    }
  } else {
    const updated = await db.user.update({
      where: { id: existing.id },
      data: {
        email: 'admin@apexflow.cloud',
        password: 'Admin@180H',
      }
    })
    console.log('Updated user:', updated.email, updated.name, updated.role)
  }
  
  // Verify the update
  const verify = await db.user.findUnique({
    where: { email: 'admin@apexflow.cloud' }
  })
  console.log('Verification:', verify ? `Found: ${verify.email}, role: ${verify.role}` : 'NOT FOUND')
  
  await db.$disconnect()
}

updateCredentials().catch(e => { console.error(e); process.exit(1) })
