import type { AIProvider, AIModel, ChatMessage, StreamEvent, TokenUsage } from '@/lib/types'

export interface ProviderResponse {
  message: string
  provider: AIProvider
  model: string
  usage: TokenUsage
  finishReason: string
  createdAt: string
  reasoning?: string
}

export interface StreamCallback {
  onText: (text: string) => void
  onThinking: (text: string) => void
  onDone: (response: ProviderResponse) => void
  onError: (error: Error) => void
}

export abstract class BaseAIProvider {
  protected apiKey: string
  protected baseUrl?: string
  abstract readonly id: AIProvider
  abstract readonly name: string
  abstract readonly models: AIModel[]

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  abstract chat(messages: ChatMessage[], model: string, options?: ChatOptions): Promise<ProviderResponse>
  abstract stream(messages: ChatMessage[], model: string, callbacks: StreamCallback, options?: ChatOptions): Promise<void>

  getModel(modelId: string): AIModel | undefined {
    return this.models.find(m => m.id === modelId)
  }

  getFirstModel(): AIModel {
    return this.models[0]
  }

  protected normalizeResponse(response: any, model: string): ProviderResponse {
    return {
      message: response.message || response.content || '',
      provider: this.id,
      model,
      usage: response.usage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      finishReason: response.finishReason || response.finish_reason || 'stop',
      createdAt: new Date().toISOString(),
      reasoning: response.reasoning,
    }
  }
}

export interface ChatOptions {
  temperature?: number
  topP?: number
  maxTokens?: number
  frequencyPenalty?: number
  presencePenalty?: number
  systemPrompt?: string
}

export interface ProviderInfo {
  id: AIProvider
  name: string
  description: string
  icon: string
  color: string
  enabled: boolean
  requiresApiKey: boolean
}

export const PROVIDER_INFO: Record<AIProvider, ProviderInfo> = {
  claude: {
    id: 'claude',
    name: 'Claude',
    description: 'Anthropic\'s Claude - Advanced reasoning and analysis',
    icon: 'brain',
    color: '#D4756B',
    enabled: false,
    requiresApiKey: true,
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    description: 'Google\'s Gemini - Multimodal AI',
    icon: 'sparkles',
    color: '#4285F4',
    enabled: false,
    requiresApiKey: true,
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast inference with Groq',
    icon: 'zap',
    color: '#F55036',
    enabled: true,
    requiresApiKey: true,
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Access multiple models via OpenRouter',
    icon: 'network',
    color: '#6366F1',
    enabled: false,
    requiresApiKey: true,
  },
  cerebras: {
    id: 'cerebras',
    name: 'Cerebras',
    description: 'Cerebras inference engine',
    icon: 'cpu',
    color: '#FF6B35',
    enabled: false,
    requiresApiKey: true,
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral',
    description: 'Mistral AI models',
    icon: 'wind',
    color: '#FF7000',
    enabled: true,
    requiresApiKey: true,
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'DeepSeek reasoning models',
    icon: 'search',
    color: '#4D6BFE',
    enabled: false,
    requiresApiKey: true,
  },
}
