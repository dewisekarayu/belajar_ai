import { NextResponse } from 'next/server'

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
  const result = providers.map(p => ({
    id: p.id,
    configured: !!(process.env[p.key] && process.env[p.key]!.trim() !== ''),
  }))
  return NextResponse.json(result)
}
