import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

function getUser(request: Request) {
  const token = request.headers.get('cookie')?.match(/auth_token=([^;]+)/)?.[1]
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.userId || null
}

export async function GET(request: Request) {
  const userId = getUser(request)
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  let settings = await prisma.userSetting.findUnique({ where: { userId } })
  if (!settings) {
    settings = await prisma.userSetting.create({
      data: { userId, defaultProvider: 'groq', defaultModel: 'llama-3.3-70b-versatile' },
    })
  }

  return NextResponse.json(settings)
}

export async function PUT(request: Request) {
  const userId = getUser(request)
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { defaultProvider, defaultModel, theme, temperature, maxTokens, topP, streaming, systemPrompt } = body

  const settings = await prisma.userSetting.upsert({
    where: { userId },
    update: {
      ...(defaultProvider !== undefined && { defaultProvider }),
      ...(defaultModel !== undefined && { defaultModel }),
      ...(theme !== undefined && { theme }),
      ...(temperature !== undefined && { temperature }),
      ...(maxTokens !== undefined && { maxTokens }),
      ...(topP !== undefined && { topP }),
      ...(streaming !== undefined && { streaming }),
      ...(systemPrompt !== undefined && { systemPrompt }),
    },
    create: {
      userId,
      defaultProvider: defaultProvider || 'groq',
      defaultModel: defaultModel || 'llama-3.3-70b-versatile',
      theme: theme || 'light',
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 4096,
      topP: topP || 1,
      streaming: streaming ?? true,
      systemPrompt: systemPrompt || '',
    },
  })

  return NextResponse.json(settings)
}
