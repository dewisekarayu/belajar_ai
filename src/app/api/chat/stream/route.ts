import { NextResponse } from 'next/server'

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful AI assistant. Be concise and accurate. Use Markdown when helpful.'

interface ChatMessage {
  role: string
  content: string
}

interface ChatOptions {
  temperature?: number
  topP?: number
  maxTokens?: number
  systemPrompt?: string
}

function truncateMessages(messages: ChatMessage[], max: number = 30): ChatMessage[] {
  if (messages.length <= max) return messages
  return [messages[0], ...messages.slice(-(max - 1))]
}

function mapModel(model: string): string {
  const mapping: Record<string, string> = {
    'kc/openai/gpt-4.1': 'dewis',
    'kc/openai/o3': 'dewis',
    'kc/deepseek/deepseek-chat': 'dewis',
    'kc/deepseek/deepseek-reasoner': 'dewis',
    'kc/anthropic/claude-sonnet-4-20250514': 'dewis',
    'kc/anthropic/claude-opus-4-20250514': 'dewis',
    'kc/google/gemini-2.5-pro': 'dewis',
    'kc/google/gemini-2.5-flash': 'dewis',
  }
  return mapping[model] || model
}

async function chatWith9Router(
  messages: ChatMessage[],
  model: string,
  options: ChatOptions,
  stream: boolean
) {
  const baseURL = process.env.OPENAI_BASE_URL || 'http://127.0.0.1:20128/v1'
  const apiKey = process.env.OPENAI_API_KEY?.trim()

  const sys = options.systemPrompt || DEFAULT_SYSTEM_PROMPT
  const formattedMessages = [
    { role: 'system', content: sys },
    ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
  ]

  const mappedModel = mapModel(model)

  const payload = {
    model: mappedModel || 'dewis',
    messages: formattedMessages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens || 4096,
    top_p: options.topP ?? 1,
    stream,
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

  const response = await fetch(`${baseURL}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    throw new Error(`9Router Error (${response.status}): ${errBody}`)
  }

  if (stream) return { streamBody: response.body, model: model || 'dewis' }

  const rawData = await response.json()
  const data = rawData.data && Array.isArray(rawData.data.choices) ? rawData.data : rawData
  const choice = data.choices[0]
  const usage = data.usage

  return {
    message: choice.message.content || '',
    usage: {
      inputTokens: usage?.prompt_tokens || 0,
      outputTokens: usage?.completion_tokens || 0,
      totalTokens: usage?.total_tokens || 0,
    },
    provider: '9router',
    model: model || 'dewis',
    finishReason: choice.finish_reason || 'stop',
  }
}

export async function POST(request: Request) {
  try {
    const { model, messages, stream, options } = await request.json()

    const finalSystemPrompt = options?.systemPrompt || DEFAULT_SYSTEM_PROMPT
    const truncatedMessages = truncateMessages(messages)

    const result = await chatWith9Router(
      truncatedMessages,
      model,
      { ...(options || {}), systemPrompt: finalSystemPrompt },
      stream
    )

    if (stream && result.streamBody) {
      return new Response(result.streamBody, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    const msg = error?.message || String(error) || ''

    if (error?.type === 'missing_api_key') {
      return NextResponse.json({ type: 'missing_api_key', message: error.message }, { status: 428 })
    }
    if (msg.includes('402') || msg.toLowerCase().includes('insufficient')) {
      return NextResponse.json({ type: 'no_credits', message: 'Saldo atau kuota pada provider habis.' }, { status: 402 })
    }
    if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
      return NextResponse.json({ type: 'rate_limited', message: 'Terlalu banyak permintaan. Coba lagi sebentar.' }, { status: 429 })
    }
    if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
      return NextResponse.json({ type: 'invalid_key', message: 'API Key tidak valid.' }, { status: 401 })
    }

    console.error('Chat error:', error)
    return NextResponse.json({ message: `Error: ${msg.slice(0, 200)}` }, { status: 500 })
  }
}