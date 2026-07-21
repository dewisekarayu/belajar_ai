import type { ChatMessage, AIModel } from '@/lib/types'
import { BaseAIProvider, type ProviderResponse, type StreamCallback, type ChatOptions } from './base'

const CEREBRAS_MODELS: AIModel[] = [
  { id: 'gpt-oss-120b', name: 'GPT-OSS 120B', provider: 'cerebras', maxTokens: 8192, contextWindow: 128000, inputPrice: 0, outputPrice: 0, supportsStreaming: true, supportsImages: false },
  { id: 'zai-glm-4.7', name: 'GLM-4.7', provider: 'cerebras', maxTokens: 8192, contextWindow: 128000, inputPrice: 0, outputPrice: 0, supportsStreaming: true, supportsImages: false },
  { id: 'gemma-4-31b', name: 'Gemma 4 31B', provider: 'cerebras', maxTokens: 8192, contextWindow: 128000, inputPrice: 0, outputPrice: 0, supportsStreaming: true, supportsImages: false },
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
