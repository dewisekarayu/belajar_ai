import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

// Set the WebSocket constructor for the Neon serverless driver
neonConfig.webSocketConstructor = ws

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = (() => {
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    // On Vercel (production), use the Neon serverless WebSocket pooler
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const adapter = new PrismaNeon(pool)
    return new PrismaClient({ adapter })
  } else {
    // Use standard Prisma Client locally or if DATABASE_URL is not configured
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient()
    }
    return globalForPrisma.prisma
  }
})()
