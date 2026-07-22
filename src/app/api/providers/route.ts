import { NextResponse } from 'next/server'
import { PROVIDER_INFO } from '@/lib/providers'

const providers = [
  { id: 'claude', key: 'CLAUDE_API_KEY' },
  { id: 'gemini', key: 'GEMINI_API_KEY' },
  { id: 'groq', key: 'GROQ_API_KEY' },
  { id: 'openrouter', key: 'OPENROUTER_API_KEY' },
  { id: 'cerebras', key: 'CEREBRAS_API_KEY' },
  { id: 'mistral', key: 'MISTRAL_API_KEY' },
  { id: 'deepseek', key: 'DEEPSEEK_API_KEY' },
]

export async function GET() {
  // Jika menggunakan local proxy (9Router), semua provider dianggap terkonfigurasi
  const isLocalProxy = process.env.OPENAI_BASE_URL?.includes('localhost') ||
    process.env.OPENAI_BASE_URL?.includes('127.0.0.1')

  const result = providers
    .filter(p => PROVIDER_INFO[p.id as keyof typeof PROVIDER_INFO]?.enabled !== false)
    .map(p => ({
      id: p.id,
      configured: isLocalProxy || !!(process.env[p.key] && process.env[p.key]!.trim() !== ''),
    }))
  return NextResponse.json(result)
}
