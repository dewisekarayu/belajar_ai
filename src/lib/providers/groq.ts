import type { ChatMessage, AIModel } from '@/lib/types'
import { BaseAIProvider, type ProviderResponse, type StreamCallback, type ChatOptions } from './base'

const GROQ_MODELS: AIModel[] = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', provider: 'groq', maxTokens: 32768, contextWindow: 128000, inputPrice: 0.59, outputPrice: 0.79, supportsStreaming: true, supportsImages: false },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', provider: 'groq', maxTokens: 8192, contextWindow: 128000, inputPrice: 0.05, outputPrice: 0.08, supportsStreaming: true, supportsImages: false },
  { id: 'llama-3.2-1b-preview', name: 'Llama 3.2 1B', provider: 'groq', maxTokens: 8192, contextWindow: 8192, inputPrice: 0.02, outputPrice: 0.02, supportsStreaming: true, supportsImages: false },
  { id: 'llama-3.2-3b-preview', name: 'Llama 3.2 3B', provider: 'groq', maxTokens: 8192, contextWindow: 8192, inputPrice: 0.06, outputPrice: 0.06, supportsStreaming: true, supportsImages: false },
  { id: 'llama-3.2-11b-vision-preview', name: 'Llama 3.2 11B Vision', provider: 'groq', maxTokens: 8192, contextWindow: 128000, inputPrice: 0.18, outputPrice: 0.18, supportsStreaming: true, supportsImages: true },
  { id: 'llama-3.2-90b-vision-preview', name: 'Llama 3.2 90B Vision', provider: 'groq', maxTokens: 8192, contextWindow: 128000, inputPrice: 0.9, outputPrice: 0.9, supportsStreaming: true, supportsImages: true },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B', provider: 'groq', maxTokens: 8192, contextWindow: 8192, inputPrice: 0.2, outputPrice: 0.2, supportsStreaming: true, supportsImages: false },
  { id: 'qwen-qwq-32b', name: 'Qwen QwQ 32B', provider: 'groq', maxTokens: 32768, contextWindow: 128000, inputPrice: 0.27, outputPrice: 0.35, supportsStreaming: true, supportsImages: false },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', provider: 'groq', maxTokens: 32768, contextWindow: 128000, inputPrice: 0.59, outputPrice: 0.79, supportsStreaming: true, supportsImages: false },
  { id: 'deepseek-r1-distill-llama-8b', name: 'DeepSeek R1 Distill 8B', provider: 'groq', maxTokens: 8192, contextWindow: 128000, inputPrice: 0.05, outputPrice: 0.08, supportsStreaming: true, supportsImages: false },
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
