import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const hasUrl = !!process.env.DATABASE_URL
    const urlLength = process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0
    const urlPrefix = process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) : 'none'

    const userCount = await prisma.user.count()

    return NextResponse.json({
      status: 'success',
      message: 'Database connection is successful!',
      details: {
        hasUrl,
        urlLength,
        urlPrefix,
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
        envKeys: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('URL') || k.includes('PRISMA'))
      }
    }, { status: 500 })
  }
}
