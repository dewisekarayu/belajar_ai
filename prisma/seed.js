const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const users = [
    { name: 'Admin', username: 'admin', email: 'admin@example.com', password: await bcrypt.hash('password123', 12) },
    { name: 'User One', username: 'user1', email: 'user1@example.com', password: await bcrypt.hash('password123', 12) },
    { name: 'User Two', username: 'user2', email: 'user2@example.com', password: await bcrypt.hash('password123', 12) },
  ]

  for (const userData of users) {
    const existing = await prisma.user.findUnique({ where: { email: userData.email } })
    if (!existing) {
      const user = await prisma.user.create({ data: userData })
      await prisma.userSetting.create({
        data: { userId: user.id, defaultProvider: 'groq', defaultModel: 'llama-3.3-70b-versatile' },
      })
      console.log(`Created: ${userData.email}`)
    }
  }
  console.log('Done!')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
