import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

function getUser(request: Request) {
  const token = request.headers.get('cookie')?.match(/auth_token=([^;]+)/)?.[1]
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.userId || null
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const userId = getUser(request)
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const session = await prisma.chatSession.findFirst({ where: { id: params.id, userId } })
  if (!session) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId: params.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(messages)
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = getUser(request)
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const session = await prisma.chatSession.findFirst({ where: { id: params.id, userId } })
  if (!session) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { role, content, provider, model, tokenInput, tokenOutput } = body

  const message = await prisma.chatMessage.create({
    data: {
      sessionId: params.id,
      role,
      content,
      provider,
      model,
      tokenInput: tokenInput || null,
      tokenOutput: tokenOutput || null,
    },
  })

  await prisma.chatSession.update({ where: { id: params.id }, data: { updatedAt: new Date() } })

  return NextResponse.json(message, { status: 201 })
}
