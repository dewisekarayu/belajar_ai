import type { ChatMessage } from '@/lib/types'
import { BaseAIProvider, type ProviderResponse, type StreamCallback, type ChatOptions } from './base'
import type { AIModel } from '@/lib/types'

const CLAUDE_MODELS: AIModel[] = [
  {
    id: 'dewis',
    name: 'Free (dewis)',
    provider: 'claude',
    maxTokens: 4096,
    contextWindow: 32768,
    inputPrice: 0,
    outputPrice: 0,
    supportsStreaming: true,
    supportsImages: false,
  },
  {
    id: 'kc/anthropic/claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'claude',
    maxTokens: 8192,
    contextWindow: 200000,
    inputPrice: 3,
    outputPrice: 15,
    supportsStreaming: true,
    supportsImages: true,
  },
  {
    id: 'cl/anthropic/claude-sonnet-4.6',
    name: 'Claude Sonnet 4.6',
    provider: 'claude',
    maxTokens: 8192,
    contextWindow: 1000000,
    inputPrice: 3,
    outputPrice: 15,
    supportsStreaming: true,
    supportsImages: true,
  },
  {
    id: 'kc/anthropic/claude-opus-4-20250514',
    name: 'Claude Opus 4',
    provider: 'claude',
    maxTokens: 8192,
    contextWindow: 200000,
    inputPrice: 15,
    outputPrice: 75,
    supportsStreaming: true,
    supportsImages: true,
  },
]

export class ClaudeProvider extends BaseAIProvider {
  readonly id = 'claude' as const
  readonly name = 'Claude'
  readonly models = CLAUDE_MODELS

  async chat(messages: ChatMessage[], model: string, options?: ChatOptions): Promise<ProviderResponse> {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'claude',
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        options,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Claude API request failed')
    }

    return response.json()
  }

  async stream(messages: ChatMessage[], model: string, callbacks: StreamCallback, options?: ChatOptions): Promise<void> {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'claude',
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: true,
        options,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      callbacks.onError(new Error(error.message || 'Claude API request failed'))
      return
    }

    const reader = response.body?.getReader()
    if (!reader) {
      callbacks.onError(new Error('No response body'))
      return
    }

    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter(line => line.trim())

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            callbacks.onDone({
              message: fullText,
              provider: 'claude',
              model,
              usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
              finishReason: 'stop',
              createdAt: new Date().toISOString(),
            })
            return
          }
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'text' && parsed.content) {
              fullText += parsed.content
              callbacks.onText(parsed.content)
            } else if (parsed.type === 'thinking' && parsed.content) {
              callbacks.onThinking(parsed.content)
            } else if (parsed.type === 'done') {
              callbacks.onDone(parsed.response)
              return
            } else if (parsed.type === 'error') {
              callbacks.onError(new Error(parsed.message))
              return
            }
          } catch {}
        }
      }
    }

    callbacks.onDone({
      message: fullText,
      provider: 'claude',
      model,
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      finishReason: 'stop',
      createdAt: new Date().toISOString(),
    })
  }
}
