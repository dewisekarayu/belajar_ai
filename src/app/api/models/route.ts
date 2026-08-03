import { NextResponse } from 'next/server'
import { getModelsForProvider } from '@/lib/providers'
import type { AIModel } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function fetchModelsFrom9Router(): Promise<any[]> {
  const baseURL = process.env.OPENAI_BASE_URL
  if (!baseURL) return []
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  const headers: Record<string, string> = {}
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

  try {
    const res = await fetch(`${baseURL}/models`, { headers, next: { revalidate: 60 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.data || []
  } catch (error) {
    console.error('Failed to fetch models from 9Router:', error)
    return []
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const provider = url.searchParams.get('provider')

    if (!provider) {
      return NextResponse.json({ message: 'provider parameter required' }, { status: 400 })
    }

    const rawModels = await fetchModelsFrom9Router()
    if (rawModels.length === 0) {
      // Fallback to hardcoded list if 9Router is offline or empty
      return NextResponse.json(getModelsForProvider(provider as any))
    }

    // Filter and map models from 9Router based on the selected provider
    let filtered = rawModels

    if (provider === 'claude') {
      filtered = rawModels.filter(m => m.id === 'dewis' || m.id.includes('claude') || m.id.includes('anthropic'))
    } else if (provider === 'gemini') {
      filtered = rawModels.filter(m => m.id === 'dewis' || m.id.includes('gemini') || m.id.includes('google'))
    } else if (provider === 'deepseek') {
      filtered = rawModels.filter(m => m.id === 'dewis' || m.id.includes('deepseek'))
    } else if (provider === 'mistral') {
      filtered = rawModels.filter(m => m.id === 'dewis' || m.id.includes('mistral') || m.id.includes('mixtral') || m.id.includes('codestral'))
    } else if (provider === 'groq') {
      filtered = rawModels.filter(m => m.id === 'dewis' || m.id.includes('grok') || m.id.includes('gpt-4') || m.id.includes('o3'))
    } else if (provider === 'cerebras') {
      filtered = rawModels.filter(m => m.id === 'dewis' || m.id.includes('cerebras') || m.id.includes('llama'))
    } else if (provider === 'openrouter') {
      filtered = rawModels
    }

    const models: AIModel[] = filtered.map(m => {
      // Format a nice human-readable name from the model ID
      let name = m.id.split('/').pop() || m.id
      name = name.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

      return {
        id: m.id,
        name: m.id === 'dewis' ? 'Free (dewis)' : name,
        provider: provider as any,
        maxTokens: m.context_window || 4096,
        contextWindow: m.context_window || 128000,
        inputPrice: 0,
        outputPrice: 0,
        supportsStreaming: true,
        supportsImages: m.id.includes('vision') || m.id.includes('claude-sonnet') || m.id.includes('gpt-4') || m.id.includes('gemini'),
      }
    })

    // Ensure "Free (dewis)" is always first, then sort alphabetically by name
    models.sort((a, b) => {
      if (a.id === 'dewis') return -1
      if (b.id === 'dewis') return 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json(models)
  } catch (error: any) {
    console.error("CRITICAL ERROR IN GET /api/models:", error)
    return NextResponse.json({ message: error?.message || String(error) }, { status: 500 })
  }
}
