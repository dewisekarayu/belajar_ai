import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const hasUrl = !!process.env.DATABASE_URL
    const urlLength = process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0
    const urlMasked = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') : 'none'

    // Let's inspect the prisma client instance keys
    const prismaKeys = Object.keys(prisma)
    const isAdapterDefined = '_engine' in prisma && (prisma as any)._engine?.adapter !== undefined

    const userCount = await prisma.user.count()

    return NextResponse.json({
      status: 'success',
      message: 'Database connection is successful!',
      details: {
        hasUrl,
        urlLength,
        urlMasked,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL,
        isAdapterDefined,
        userCount
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed!',
      error: error.message || String(error),
      stack: error.stack || null,
      details: {
        hasUrl: !!process.env.DATABASE_URL,
        urlLength: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,
        urlMasked: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') : 'none',
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL,
        isAdapterDefined: '_engine' in prisma && (prisma as any)._engine?.adapter !== undefined,
        envKeys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('URL') || k.includes('PRISMA'))
      }
    }, { status: 500 })
  }
}
