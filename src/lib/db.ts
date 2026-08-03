import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = (() => {
  if (process.env.NODE_ENV === 'production') {
    // On Vercel (production), use the Neon serverless WebSocket pooler
    const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
    const adapter = new PrismaNeon(pool)
    return new PrismaClient({ adapter })
  } else {
    // Use standard Prisma Client locally
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient()
    }
    return globalForPrisma.prisma
  }
})()
