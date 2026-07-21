import { NextResponse } from 'next/server'
import { getModelsForProvider } from '@/lib/providers'
import type { AIModel } from '@/lib/types'

async function fetchGroqModels(): Promise<AIModel[]> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return getModelsForProvider('groq')

  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) return getModelsForProvider('groq')
    const data = await res.json()
    return data.data
      .filter((m: any) => m.active && !m.owned_by?.includes('whisper'))
      .map((m: any) => ({
        id: m.id,
        name: m.id.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        provider: 'groq' as const,
        maxTokens: m.context_window || 32768,
        contextWindow: m.context_window || 128000,
        inputPrice: 0,
        outputPrice: 0,
        supportsStreaming: true,
        supportsImages: m.id.includes('vision'),
      }))
      .sort((a: AIModel, b: AIModel) => a.name.localeCompare(b.name))
  } catch {
    return getModelsForProvider('groq')
  }
}

async function fetchOpenRouterModels(): Promise<AIModel[]> {
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models')
    if (!res.ok) return getModelsForProvider('openrouter')
    const data = await res.json()
    return data.data
      .filter((m: any) => !m.id.includes('free') && m.pricing?.prompt)
      .map((m: any) => ({
        id: m.id,
        name: m.name || m.id.split('/').pop(),
        provider: 'openrouter' as const,
        maxTokens: m.top_provider?.max_completion_tokens || 4096,
        contextWindow: m.context_length || 128000,
        inputPrice: parseFloat(m.pricing?.prompt || '0') * 1000000,
        outputPrice: parseFloat(m.pricing?.completion || '0') * 1000000,
        supportsStreaming: true,
        supportsImages: m.architecture?.modality?.includes('image') || false,
      }))
      .sort((a: AIModel, b: AIModel) => a.name.localeCompare(b.name))
      .slice(0, 200)
  } catch {
    return getModelsForProvider('openrouter')
  }
}

async function fetchCerebrasModels(): Promise<AIModel[]> {
  const apiKey = process.env.CEREBRAS_API_KEY?.trim()
  if (!apiKey) return getModelsForProvider('cerebras')

  try {
    const res = await fetch('https://api.cerebras.ai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!res.ok) return getModelsForProvider('cerebras')
    const data = await res.json()
    return (data.data || [])
      .map((m: any) => ({
        id: m.id,
        name: m.id.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        provider: 'cerebras' as const,
        maxTokens: 8192,
        contextWindow: 128000,
        inputPrice: 0,
        outputPrice: 0,
        supportsStreaming: true,
        supportsImages: false,
      }))
      .sort((a: AIModel, b: AIModel) => a.name.localeCompare(b.name))
  } catch {
    return getModelsForProvider('cerebras')
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const provider = url.searchParams.get('provider')

  if (!provider) {
    return NextResponse.json({ message: 'provider parameter required' }, { status: 400 })
  }

  let models: AIModel[] = []

  switch (provider) {
    case 'groq':
      models = await fetchGroqModels()
      break
    case 'openrouter':
      models = await fetchOpenRouterModels()
      break
    case 'cerebras':
      models = await fetchCerebrasModels()
      break
    default:
      models = getModelsForProvider(provider as any)
      break
  }

  return NextResponse.json(models)
}
