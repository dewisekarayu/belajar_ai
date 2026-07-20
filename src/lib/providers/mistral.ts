import type { ChatMessage, AIModel } from '@/lib/types'
import { BaseAIProvider, type ProviderResponse, type StreamCallback, type ChatOptions } from './base'

const MISTRAL_MODELS: AIModel[] = [
  { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'mistral', maxTokens: 8192, contextWindow: 128000, inputPrice: 2, outputPrice: 6, supportsStreaming: true, supportsImages: true },
  { id: 'mistral-medium-latest', name: 'Mistral Medium', provider: 'mistral', maxTokens: 8192, contextWindow: 128000, inputPrice: 2.7, outputPrice: 8.1, supportsStreaming: true, supportsImages: false },
  { id: 'mistral-small-latest', name: 'Mistral Small', provider: 'mistral', maxTokens: 8192, contextWindow: 128000, inputPrice: 0.2, outputPrice: 0.6, supportsStreaming: true, supportsImages: false },
  { id: 'ministral-8b-latest', name: 'Ministral 8B', provider: 'mistral', maxTokens: 8192, contextWindow: 32000, inputPrice: 0.1, outputPrice: 0.1, supportsStreaming: true, supportsImages: false },
  { id: 'ministral-3b-latest', name: 'Ministral 3B', provider: 'mistral', maxTokens: 8192, contextWindow: 32000, inputPrice: 0.04, outputPrice: 0.04, supportsStreaming: true, supportsImages: false },
  { id: 'codestral-latest', name: 'Codestral', provider: 'mistral', maxTokens: 8192, contextWindow: 32000, inputPrice: 0.3, outputPrice: 0.9, supportsStreaming: true, supportsImages: false },
  { id: 'pixtral-large-latest', name: 'Pixtral Large', provider: 'mistral', maxTokens: 8192, contextWindow: 128000, inputPrice: 2, outputPrice: 6, supportsStreaming: true, supportsImages: true },
  { id: 'open-mixtral-8x22b', name: 'Mixtral 8x22B', provider: 'mistral', maxTokens: 8192, contextWindow: 65536, inputPrice: 2, outputPrice: 6, supportsStreaming: true, supportsImages: false },
  { id: 'open-mixtral-8x7b', name: 'Mixtral 8x7B', provider: 'mistral', maxTokens: 8192, contextWindow: 32768, inputPrice: 0.6, outputPrice: 0.6, supportsStreaming: true, supportsImages: false },
]

export class MistralProvider extends BaseAIProvider {
  readonly id = 'mistral' as const
  readonly name = 'Mistral'
  readonly models = MISTRAL_MODELS

  async chat(messages: ChatMessage[], model: string, options?: ChatOptions): Promise<ProviderResponse> {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'mistral', model, messages: messages.map(m => ({ role: m.role, content: m.content })), options }),
    })
    if (!response.ok) throw new Error('Mistral API request failed')
    return response.json()
  }

  async stream(messages: ChatMessage[], model: string, callbacks: StreamCallback, options?: ChatOptions): Promise<void> {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'mistral', model, messages: messages.map(m => ({ role: m.role, content: m.content })), stream: true, options }),
    })
    if (!response.ok) { callbacks.onError(new Error('Mistral API request failed')); return }
    const reader = response.body?.getReader()
    if (!reader) { callbacks.onError(new Error('No response body')); return }
    const decoder = new TextDecoder()
    let fullText = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n').filter(l => l.trim())) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') { callbacks.onDone({ message: fullText, provider: 'mistral', model, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, finishReason: 'stop', createdAt: new Date().toISOString() }); return }
          try { const p = JSON.parse(data); if (p.type === 'text' && p.content) { fullText += p.content; callbacks.onText(p.content) } } catch {}
        }
      }
    }
    callbacks.onDone({ message: fullText, provider: 'mistral', model, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, finishReason: 'stop', createdAt: new Date().toISOString() })
  }
}
