import type { ChatMessage, AIModel } from '@/lib/types'
import { BaseAIProvider, type ProviderResponse, type StreamCallback, type ChatOptions } from './base'

const DEEPSEEK_MODELS: AIModel[] = [
  { id: 'deepseek-chat', name: 'DeepSeek Chat (V3)', provider: 'deepseek', maxTokens: 8192, contextWindow: 128000, inputPrice: 0.14, outputPrice: 0.28, supportsStreaming: true, supportsImages: false },
  { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)', provider: 'deepseek', maxTokens: 8192, contextWindow: 128000, inputPrice: 0.55, outputPrice: 2.19, supportsStreaming: true, supportsImages: false },
]

export class DeepSeekProvider extends BaseAIProvider {
  readonly id = 'deepseek' as const
  readonly name = 'DeepSeek'
  readonly models = DEEPSEEK_MODELS

  async chat(messages: ChatMessage[], model: string, options?: ChatOptions): Promise<ProviderResponse> {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'deepseek', model, messages: messages.map(m => ({ role: m.role, content: m.content })), options }),
    })
    if (!response.ok) throw new Error('DeepSeek API request failed')
    return response.json()
  }

  async stream(messages: ChatMessage[], model: string, callbacks: StreamCallback, options?: ChatOptions): Promise<void> {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'deepseek', model, messages: messages.map(m => ({ role: m.role, content: m.content })), stream: true, options }),
    })
    if (!response.ok) { callbacks.onError(new Error('DeepSeek API request failed')); return }
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
          if (data === '[DONE]') { callbacks.onDone({ message: fullText, provider: 'deepseek', model, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, finishReason: 'stop', createdAt: new Date().toISOString() }); return }
          try { const p = JSON.parse(data); if (p.type === 'text' && p.content) { fullText += p.content; callbacks.onText(p.content) } else if (p.type === 'done') { callbacks.onDone(p.response); return } } catch {}
        }
      }
    }
    callbacks.onDone({ message: fullText, provider: 'deepseek', model, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, finishReason: 'stop', createdAt: new Date().toISOString() })
  }
}
