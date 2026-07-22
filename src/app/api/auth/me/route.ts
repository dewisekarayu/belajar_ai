import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const token = request.headers.get('cookie')?.match(/auth_token=([^;]+)/)?.[1]

    if (!token) {
      return NextResponse.json({ message: 'Tidak terautentikasi' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ message: 'Session expired' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        avatar: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ message: 'Tidak terautentikasi' }, { status: 401 })
  }
}

export async function PUT(request: Request) {
  try {
    const token = request.headers.get('cookie')?.match(/auth_token=([^;]+)/)?.[1]
    if (!token) {
      return NextResponse.json({ message: 'Tidak terautentikasi' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ message: 'Session expired' }, { status: 401 })
    }

    const body = await request.json()
    const { name, username } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (username !== undefined) updateData.username = username

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: updateData,
      select: { id: true, name: true, username: true, email: true, avatar: true, createdAt: true },
    })

    return NextResponse.json({ user })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ message: 'Username already taken' }, { status: 409 })
    }
    return NextResponse.json({ message: 'Update failed' }, { status: 500 })
  }
}
