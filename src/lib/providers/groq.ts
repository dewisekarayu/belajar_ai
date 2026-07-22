import type { ChatMessage, AIModel } from '@/lib/types'
import { BaseAIProvider, type ProviderResponse, type StreamCallback, type ChatOptions } from './base'

const GROQ_MODELS: AIModel[] = [
  { id: 'dewis', name: 'Free (dewis)', provider: 'groq', maxTokens: 4096, contextWindow: 32768, inputPrice: 0, outputPrice: 0, supportsStreaming: true, supportsImages: false },
  { id: 'kc/deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'groq', maxTokens: 8192, contextWindow: 128000, inputPrice: 0.14, outputPrice: 0.28, supportsStreaming: true, supportsImages: false },
  { id: 'kc/openai/gpt-4.1', name: 'GPT-4.1', provider: 'groq', maxTokens: 32768, contextWindow: 1000000, inputPrice: 2, outputPrice: 8, supportsStreaming: true, supportsImages: true },
  { id: 'kc/openai/o3', name: 'o3', provider: 'groq', maxTokens: 100000, contextWindow: 200000, inputPrice: 10, outputPrice: 40, supportsStreaming: true, supportsImages: true },
]

export class GroqProvider extends BaseAIProvider {
  readonly id = 'groq' as const
  readonly name = 'Groq'
  readonly models = GROQ_MODELS

  async chat(messages: ChatMessage[], model: string, options?: ChatOptions): Promise<ProviderResponse> {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'groq', model, messages: messages.map(m => ({ role: m.role, content: m.content })), options }),
    })
    if (!response.ok) throw new Error('Groq API request failed')
    return response.json()
  }

  async stream(messages: ChatMessage[], model: string, callbacks: StreamCallback, options?: ChatOptions): Promise<void> {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'groq', model, messages: messages.map(m => ({ role: m.role, content: m.content })), stream: true, options }),
    })
    if (!response.ok) { callbacks.onError(new Error('Groq API request failed')); return }
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
          if (data === '[DONE]') { callbacks.onDone({ message: fullText, provider: 'groq', model, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, finishReason: 'stop', createdAt: new Date().toISOString() }); return }
          try { const p = JSON.parse(data); if (p.type === 'text' && p.content) { fullText += p.content; callbacks.onText(p.content) } else if (p.type === 'done') { callbacks.onDone(p.response); return } else if (p.type === 'error') { callbacks.onError(new Error(p.message)); return } } catch {}
        }
      }
    }
    callbacks.onDone({ message: fullText, provider: 'groq', model, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, finishReason: 'stop', createdAt: new Date().toISOString() })
  }
}
