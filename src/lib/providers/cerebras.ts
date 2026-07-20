import type { ChatMessage, AIModel } from '@/lib/types'
import { BaseAIProvider, type ProviderResponse, type StreamCallback, type ChatOptions } from './base'

const CEREBRAS_MODELS: AIModel[] = [
  { id: 'llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'cerebras', maxTokens: 8192, contextWindow: 128000, inputPrice: 0.6, outputPrice: 0.6, supportsStreaming: true, supportsImages: false },
  { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', provider: 'cerebras', maxTokens: 8192, contextWindow: 128000, inputPrice: 0.1, outputPrice: 0.1, supportsStreaming: true, supportsImages: false },
  { id: 'llama-3.2-3b', name: 'Llama 3.2 3B', provider: 'cerebras', maxTokens: 8192, contextWindow: 8192, inputPrice: 0.05, outputPrice: 0.05, supportsStreaming: true, supportsImages: false },
  { id: 'llama-3.2-1b', name: 'Llama 3.2 1B', provider: 'cerebras', maxTokens: 8192, contextWindow: 8192, inputPrice: 0.02, outputPrice: 0.02, supportsStreaming: true, supportsImages: false },
]

export class CerebrasProvider extends BaseAIProvider {
  readonly id = 'cerebras' as const
  readonly name = 'Cerebras'
  readonly models = CEREBRAS_MODELS

  async chat(messages: ChatMessage[], model: string, options?: ChatOptions): Promise<ProviderResponse> {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'cerebras', model, messages: messages.map(m => ({ role: m.role, content: m.content })), options }),
    })
    if (!response.ok) throw new Error('Cerebras API request failed')
    return response.json()
  }

  async stream(messages: ChatMessage[], model: string, callbacks: StreamCallback, options?: ChatOptions): Promise<void> {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'cerebras', model, messages: messages.map(m => ({ role: m.role, content: m.content })), stream: true, options }),
    })
    if (!response.ok) { callbacks.onError(new Error('Cerebras API request failed')); return }
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
          if (data === '[DONE]') { callbacks.onDone({ message: fullText, provider: 'cerebras', model, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, finishReason: 'stop', createdAt: new Date().toISOString() }); return }
          try { const p = JSON.parse(data); if (p.type === 'text' && p.content) { fullText += p.content; callbacks.onText(p.content) } } catch {}
        }
      }
    }
    callbacks.onDone({ message: fullText, provider: 'cerebras', model, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, finishReason: 'stop', createdAt: new Date().toISOString() })
  }
}
