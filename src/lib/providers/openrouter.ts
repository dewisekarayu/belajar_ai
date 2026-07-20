import type { ChatMessage, AIModel } from '@/lib/types'
import { BaseAIProvider, type ProviderResponse, type StreamCallback, type ChatOptions } from './base'

const OPENROUTER_MODELS: AIModel[] = [
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'openrouter', maxTokens: 8192, contextWindow: 200000, inputPrice: 3, outputPrice: 15, supportsStreaming: true, supportsImages: true },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openrouter', maxTokens: 4096, contextWindow: 128000, inputPrice: 2.5, outputPrice: 10, supportsStreaming: true, supportsImages: true },
  { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', provider: 'openrouter', maxTokens: 8192, contextWindow: 1000000, inputPrice: 1.25, outputPrice: 10, supportsStreaming: true, supportsImages: true },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'openrouter', maxTokens: 32768, contextWindow: 128000, inputPrice: 0.1, outputPrice: 0.1, supportsStreaming: true, supportsImages: false },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'openrouter', maxTokens: 8192, contextWindow: 128000, inputPrice: 0.14, outputPrice: 0.28, supportsStreaming: true, supportsImages: false },
]

export class OpenRouterProvider extends BaseAIProvider {
  readonly id = 'openrouter' as const
  readonly name = 'OpenRouter'
  readonly models = OPENROUTER_MODELS

  async chat(messages: ChatMessage[], model: string, options?: ChatOptions): Promise<ProviderResponse> {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'openrouter', model, messages: messages.map(m => ({ role: m.role, content: m.content })), options }),
    })
    if (!response.ok) throw new Error('OpenRouter API request failed')
    return response.json()
  }

  async stream(messages: ChatMessage[], model: string, callbacks: StreamCallback, options?: ChatOptions): Promise<void> {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'openrouter', model, messages: messages.map(m => ({ role: m.role, content: m.content })), stream: true, options }),
    })
    if (!response.ok) { callbacks.onError(new Error('OpenRouter API request failed')); return }
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
          if (data === '[DONE]') { callbacks.onDone({ message: fullText, provider: 'openrouter', model, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, finishReason: 'stop', createdAt: new Date().toISOString() }); return }
          try { const p = JSON.parse(data); if (p.type === 'text' && p.content) { fullText += p.content; callbacks.onText(p.content) } else if (p.type === 'done') { callbacks.onDone(p.response); return } } catch {}
        }
      }
    }
    callbacks.onDone({ message: fullText, provider: 'openrouter', model, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, finishReason: 'stop', createdAt: new Date().toISOString() })
  }
}
