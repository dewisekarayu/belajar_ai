import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

function getUser(request: Request) {
  const token = request.headers.get('cookie')?.match(/auth_token=([^;]+)/)?.[1]
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.userId || null
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const userId = getUser(request)
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const session = await prisma.chatSession.findFirst({ where: { id: params.id, userId } })
  if (!session) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const body = await request.json()
  const updated = await prisma.chatSession.update({ where: { id: params.id }, data: body })
  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const userId = getUser(request)
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const session = await prisma.chatSession.findFirst({ where: { id: params.id, userId } })
  if (!session) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  await prisma.chatSession.delete({ where: { id: params.id } })
  return NextResponse.json({ message: 'Deleted' })
}
