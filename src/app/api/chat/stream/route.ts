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
    'kc/openai/gpt-4.1': 'ag/gpt-oss-120b-medium',
    'kc/openai/o3': 'ag/claude-opus-4-6-thinking',
    'kc/deepseek/deepseek-chat': 'dewis',
    'kc/deepseek/deepseek-reasoner': 'ag/gemini-3-flash-agent',
    'kc/anthropic/claude-sonnet-4-20250514': 'ag/claude-sonnet-4-6',
    'cl/anthropic/claude-sonnet-4.6': 'ag/claude-sonnet-4-6',
    'kc/anthropic/claude-opus-4-20250514': 'ag/claude-opus-4-6-thinking',
    'kc/google/gemini-2.5-pro': 'ag/gemini-3.1-pro-low',
    'kc/google/gemini-2.5-flash': 'ag/gemini-3.5-flash-low',
    'llama-3.3-70b-versatile': 'dewis',
    'llama 3.3 70b versatile': 'dewis',
  }
  return mapping[model] || model
}

function parseMultimodalContent(content: string): any {
  if (typeof content !== 'string') return content

  // 1. Check if it's a JSON stringified attachment object
  if (content.startsWith('{') && content.endsWith('}')) {
    try {
      const parsed = JSON.parse(content)
      if (parsed.text !== undefined && Array.isArray(parsed.attachments)) {
        const parts: any[] = []
        
        // Add text prompt
        if (parsed.text) {
          parts.push({ type: 'text', text: parsed.text })
        }
        
        // Add attachments
        for (const att of parsed.attachments) {
          if (att.type.startsWith('image/') && att.content) {
            parts.push({
              type: 'image_url',
              image_url: { url: att.content }
            })
          } else if (att.content) {
            parts.push({
              type: 'text',
              text: `[Attached Document: ${att.name}]\n\`\`\`\n${att.content}\n\`\`\``
            })
          }
        }
        
        return parts.length === 1 && parts[0].type === 'text' ? parts[0].text : parts
      }
    } catch (e) {
      // Fallback to text parsing if JSON parse fails
    }
  }

  // 2. Fallback to parsing markdown image base64 format (for backward compatibility)
  const regex = /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[^)]+)\)/g
  const parts: any[] = []
  let lastIndex = 0
  let match

  while ((match = regex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index).trim()
    if (textBefore) {
      parts.push({ type: 'text', text: textBefore })
    }
    
    parts.push({
      type: 'image_url',
      image_url: { url: match[2] }
    })
    
    lastIndex = regex.lastIndex
  }

  const textAfter = content.substring(lastIndex).trim()
  if (textAfter) {
    parts.push({ type: 'text', text: textAfter })
  }

  if (parts.length === 0) return content
  if (parts.every(p => p.type === 'text')) return content
  return parts
}

async function chatWith9Router(
  messages: ChatMessage[],
  model: string,
  options: ChatOptions,
  stream: boolean
) {
  const baseURL = process.env.OPENAI_BASE_URL || 'http://' + '127.0.0.1' + ':20128/v1'
  const apiKey = process.env.OPENAI_API_KEY?.trim()

  const imageGenInstructions = "\n\nImage Generation Capabilities: You can generate images when asked. If the user asks you to generate, create, draw, or visualize an image, you must output a markdown image tag inline. Format: `![Description](https://image.pollinations.ai/prompt/encoded_prompt?width=1024&height=1024&nologo=true)`. Replace `encoded_prompt` with a detailed, creative English prompt describing the image (URL-encoded, e.g. space becomes %20). Do not write raw HTML, only use standard markdown image tag. You can write a short explanation of the image in Indonesian before or after the image tag, but keep the prompt inside the URL in English for better results."
  const sys = (options.systemPrompt || DEFAULT_SYSTEM_PROMPT) + imageGenInstructions
  const formattedMessages = [
    { role: 'system', content: sys },
    ...messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role,
      content: m.role === 'user' ? parseMultimodalContent(m.content) : m.content
    })),
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

function extractContent(parsed: any): string | null {
  if (!parsed) return null
  if (parsed.choices?.[0]?.delta?.content !== undefined) {
    return parsed.choices[0].delta.content
  }
  if (parsed.data?.choices?.[0]?.delta?.content !== undefined) {
    return parsed.data.choices[0].delta.content
  }
  if (parsed.choices?.[0]?.text !== undefined) {
    return parsed.choices[0].text
  }
  return null
}

async function* makeTransformedStream(rawStream: ReadableStream) {
  const reader = rawStream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue

        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6).trim()
          if (dataStr === '[DONE]') {
            yield `data: [DONE]\n\n`
            break
          }

          try {
            const parsed = JSON.parse(dataStr)
            if (parsed.error) {
              yield `data: ${JSON.stringify({ type: 'error', message: parsed.error.message || 'API Error' })}\n\n`
              continue
            }
            const content = extractContent(parsed)
            if (content) {
              yield `data: ${JSON.stringify({ type: 'text', content })}\n\n`
            }
          } catch (e) {
            // Ignore parse errors for incomplete JSON lines
          }
        }
      }
    }
  } catch (error: any) {
    yield `data: ${JSON.stringify({ type: 'error', message: error?.message || 'Stream error' })}\n\n`
  } finally {
    reader.releaseLock()
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
      const encoder = new TextEncoder()
      const customStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of makeTransformedStream(result.streamBody!)) {
              controller.enqueue(encoder.encode(chunk))
            }
          } catch (e: any) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: e?.message || 'Stream failed' })}\n\n`))
          } finally {
            controller.close()
          }
        }
      })

      return new Response(customStream, {
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