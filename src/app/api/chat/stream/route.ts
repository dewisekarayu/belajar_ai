import { NextResponse } from 'next/server'

const systemPrompt = 'You are a helpful AI assistant. Provide clear, concise, and accurate responses. Format responses using Markdown when appropriate.'

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

async function chatClaude(messages: ChatMessage[], model: string, options: ChatOptions, stream: boolean) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) throw { type: 'missing_api_key', message: 'Claude API Key belum dikonfigurasi.', provider: 'claude' }

  const client = new Anthropic({ apiKey })
  const sys = options.systemPrompt || systemPrompt
  const claudeMessages = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  if (stream) {
    const response = await client.messages.stream({
      model: model || 'claude-sonnet-4-20250514',
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7,
      top_p: options.topP ?? 1,
      system: sys,
      messages: claudeMessages,
    })
    return { stream: response, provider: 'claude', model: model || 'claude-sonnet-4-20250514' }
  }

  const response = await client.messages.create({
    model: model || 'claude-sonnet-4-20250514',
    max_tokens: options.maxTokens || 4096,
    temperature: options.temperature ?? 0.7,
    top_p: options.topP ?? 1,
    system: sys,
    messages: claudeMessages,
  })
  const text = response.content.map(b => b.type === 'text' ? b.text : '').join('')
  return {
    message: text,
    usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens, totalTokens: response.usage.input_tokens + response.usage.output_tokens },
    provider: 'claude', model: model || 'claude-sonnet-4-20250514', finishReason: response.stop_reason || 'stop',
  }
}

async function chatGemini(messages: ChatMessage[], model: string, options: ChatOptions) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw { type: 'missing_api_key', message: 'Gemini API Key belum dikonfigurasi.', provider: 'gemini' }

  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(apiKey)
  const sys = options.systemPrompt || systemPrompt
  const geminiMessages = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const generativeModel = genAI.getGenerativeModel({
    model: model || 'gemini-2.5-flash',
    systemInstruction: sys,
  })

  const chat = generativeModel.startChat({ history: geminiMessages.slice(0, -1) })
  const lastMsg = geminiMessages[geminiMessages.length - 1]
  const result = await chat.sendMessage(lastMsg.parts[0].text)
  const response = result.response
  const text = response.text()
  const usage = response.usageMetadata

  return {
    message: text,
    usage: { inputTokens: usage?.promptTokenCount || 0, outputTokens: usage?.candidatesTokenCount || 0, totalTokens: usage?.totalTokenCount || 0 },
    provider: 'gemini', model: model || 'gemini-2.5-flash', finishReason: 'stop',
  }
}

async function chatGroq(messages: ChatMessage[], model: string, options: ChatOptions) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw { type: 'missing_api_key', message: 'Groq API Key belum dikonfigurasi.', provider: 'groq' }

  const Groq = (await import('groq-sdk')).default
  const client = new Groq({ apiKey })
  const sys = options.systemPrompt || systemPrompt
  const groqMessages = [{ role: 'system' as const, content: sys }, ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))]

  const response = await client.chat.completions.create({
    model: model || 'llama-3.3-70b-versatile',
    messages: groqMessages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens || 4096,
    top_p: options.topP ?? 1,
  })

  const choice = response.choices[0]
  const usage = response.usage

  return {
    message: choice.message.content || '',
    usage: { inputTokens: usage?.prompt_tokens || 0, outputTokens: usage?.completion_tokens || 0, totalTokens: usage?.total_tokens || 0 },
    provider: 'groq', model: model || 'llama-3.3-70b-versatile', finishReason: choice.finish_reason || 'stop',
  }
}

async function chatOpenRouter(messages: ChatMessage[], model: string, options: ChatOptions) {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw { type: 'missing_api_key', message: 'OpenRouter API Key belum dikonfigurasi.', provider: 'openrouter' }

  const sys = options.systemPrompt || systemPrompt
  const orMessages = [{ role: 'system', content: sys }, ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }))]

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, 'HTTP-Referer': 'http://localhost:3000', 'X-Title': 'AI Chat Premium' },
    body: JSON.stringify({ model: model || 'anthropic/claude-sonnet-4', messages: orMessages, temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens || 4096, top_p: options.topP ?? 1 }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || 'OpenRouter request failed')
  }

  const data = await response.json()
  const choice = data.choices[0]
  const usage = data.usage

  return {
    message: choice.message.content || '',
    usage: { inputTokens: usage?.prompt_tokens || 0, outputTokens: usage?.completion_tokens || 0, totalTokens: usage?.total_tokens || 0 },
    provider: 'openrouter', model: model || 'anthropic/claude-sonnet-4', finishReason: choice.finish_reason || 'stop',
  }
}

async function chatCerebras(messages: ChatMessage[], model: string, options: ChatOptions) {
  const apiKey = process.env.CEREBRAS_API_KEY
  if (!apiKey) throw { type: 'missing_api_key', message: 'Cerebras API Key belum dikonfigurasi.', provider: 'cerebras' }

  const sys = options.systemPrompt || systemPrompt
  const cMessages = [{ role: 'system', content: sys }, ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }))]

  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: model || 'llama-3.3-70b', messages: cMessages, temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens || 4096, top_p: options.topP ?? 1 }),
  })

  if (!response.ok) throw new Error('Cerebras request failed')
  const data = await response.json()
  const choice = data.choices[0]
  const usage = data.usage

  return {
    message: choice.message.content || '',
    usage: { inputTokens: usage?.prompt_tokens || 0, outputTokens: usage?.completion_tokens || 0, totalTokens: usage?.total_tokens || 0 },
    provider: 'cerebras', model: model || 'llama-3.3-70b', finishReason: choice.finish_reason || 'stop',
  }
}

async function chatMistral(messages: ChatMessage[], model: string, options: ChatOptions) {
  const apiKey = process.env.MISTRAL_API_KEY
  if (!apiKey) throw { type: 'missing_api_key', message: 'Mistral API Key belum dikonfigurasi.', provider: 'mistral' }

  const sys = options.systemPrompt || systemPrompt
  const mMessages = [{ role: 'system', content: sys }, ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }))]

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: model || 'mistral-large-latest', messages: mMessages, temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens || 4096, top_p: options.topP ?? 1 }),
  })

  if (!response.ok) throw new Error('Mistral request failed')
  const data = await response.json()
  const choice = data.choices[0]
  const usage = data.usage

  return {
    message: choice.message.content || '',
    usage: { inputTokens: usage?.prompt_tokens || 0, outputTokens: usage?.completion_tokens || 0, totalTokens: usage?.total_tokens || 0 },
    provider: 'mistral', model: model || 'mistral-large-latest', finishReason: choice.finish_reason || 'stop',
  }
}

async function chatDeepSeek(messages: ChatMessage[], model: string, options: ChatOptions) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) throw { type: 'missing_api_key', message: 'DeepSeek API Key belum dikonfigurasi.', provider: 'deepseek' }

  const sys = options.systemPrompt || systemPrompt
  const dMessages = [{ role: 'system', content: sys }, ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }))]

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: model || 'deepseek-chat', messages: dMessages, temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens || 4096, top_p: options.topP ?? 1 }),
  })

  if (!response.ok) throw new Error('DeepSeek request failed')
  const data = await response.json()
  const choice = data.choices[0]
  const usage = data.usage

  return {
    message: choice.message.content || '',
    usage: { inputTokens: usage?.prompt_tokens || 0, outputTokens: usage?.completion_tokens || 0, totalTokens: usage?.total_tokens || 0 },
    provider: 'deepseek', model: model || 'deepseek-chat', finishReason: choice.finish_reason || 'stop',
  }
}

const handlers: Record<string, (messages: ChatMessage[], model: string, options: ChatOptions, stream: boolean) => Promise<any>> = {
  claude: chatClaude,
  gemini: chatGemini,
  groq: chatGroq,
  openrouter: chatOpenRouter,
  cerebras: chatCerebras,
  mistral: chatMistral,
  deepseek: chatDeepSeek,
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { provider, model, messages, stream, options } = body

    const handler = handlers[provider]
    if (!handler) return NextResponse.json({ message: `Provider '${provider}' tidak didukung` }, { status: 400 })

    const result = await handler(messages, model, options || {}, stream)

    if (stream && result.stream) {
      const encoder = new TextEncoder()
      const streamResponse = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of result.stream) {
              if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: event.delta.text })}\n\n`))
              }
            }
            const finalMsg = await result.stream.finalMessage()
            const usage = { inputTokens: finalMsg.usage.input_tokens, outputTokens: finalMsg.usage.output_tokens, totalTokens: finalMsg.usage.input_tokens + finalMsg.usage.output_tokens }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', response: { message: finalMsg.content.map((b: any) => b.type === 'text' ? b.text : '').join(''), provider: result.provider, model: result.model, usage, finishReason: finalMsg.stop_reason || 'stop', createdAt: new Date().toISOString() } })}\n\n`))
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          } catch (e: any) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: e.message })}\n\n`))
          }
          controller.close()
        },
      })
      return new Response(streamResponse, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    if (error?.type === 'missing_api_key') {
      return NextResponse.json({ type: 'missing_api_key', message: error.message, provider: error.provider }, { status: 428 })
    }

    const msg = error?.message || String(error) || ''

    if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many requests')) {
      return NextResponse.json({
        type: 'rate_limited',
        message: 'Kuota API habis atau terlalu banyak request. Silakan coba lagi beberapa saat lagi, atau gunakan provider lain.',
      }, { status: 429 })
    }

    if (msg.includes('401') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('invalid api key')) {
      return NextResponse.json({
        type: 'invalid_key',
        message: 'API Key tidak valid. Silakan periksa konfigurasi API Key di halaman Settings.',
      }, { status: 401 })
    }

    if (msg.includes('403') || msg.toLowerCase().includes('forbidden')) {
      return NextResponse.json({
        type: 'forbidden',
        message: 'Akses ditolak. Pastikan API Key memiliki permission yang cukup.',
      }, { status: 403 })
    }

    console.error('Chat error:', error)
    return NextResponse.json({ message: 'Terjadi kesalahan. Silakan coba lagi atau gunakan provider lain.' }, { status: 500 })
  }
}
