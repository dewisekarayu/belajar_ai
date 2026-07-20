'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore, useSettingsStore } from '@/lib/store'
import { MessageSquare, Brain, Zap, Globe, Sparkles, Send } from 'lucide-react'

export function EmptyState() {
  const { createSession, providerStatus } = useChatStore()
  const { defaultProvider, defaultModel } = useSettingsStore()
  const router = useRouter()
  const [input, setInput] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const suggestions = [
    { text: 'Jelaskan konsep AI', icon: Brain },
    { text: 'Buat kode React', icon: Zap },
    { text: 'Ringkas dokumen', icon: Sparkles },
    { text: 'Buat roadmap belajar', icon: Globe },
  ]

  const handleCreateAndSend = async (message?: string) => {
    if (isCreating) return
    setIsCreating(true)
    try {
      const enabled = Object.entries(providerStatus).filter(([_, v]) => v)
      const provider = enabled.length > 0 ? enabled[0][0] : defaultProvider
      const { getModelsForProvider } = await import('@/lib/providers')
      const models = getModelsForProvider(provider as any)
      const modelId = models[0]?.id || defaultModel
      const sessionId = await createSession(provider, modelId)
      if (sessionId && message) {
        // Store pending message for ChatInput to pick up
        sessionStorage.setItem('pending-message-' + sessionId, message)
      }
      if (sessionId) {
        router.push('/chat')
      }
    } catch (error) {
      console.error('Failed to create chat:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      handleCreateAndSend(input.trim())
      setInput('')
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-pink-400 to-pink-300 flex items-center justify-center shadow-soft-lg">
          <MessageSquare className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">AI Chat</h2>
        <p className="text-text-secondary mb-6">Halo! Ada yang bisa saya bantu hari ini?</p>

        <form onSubmit={handleSubmit} className="relative mb-6">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ketik pesan..."
            disabled={isCreating}
            className="w-full bg-white border border-border rounded-2xl pl-4 pr-12 py-3.5 text-sm outline-none focus:border-pink-400 transition-all duration-200 shadow-soft placeholder:text-text-secondary/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isCreating}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-pink-400 to-pink-300 text-white rounded-xl hover:from-pink-500 hover:to-pink-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="grid grid-cols-2 gap-3">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleCreateAndSend(s.text)}
              disabled={isCreating}
              className="p-4 bg-surface border border-border rounded-2xl text-left hover:shadow-soft hover:border-pink-400/30 transition-all duration-200 disabled:opacity-50"
            >
              <s.icon className="w-5 h-5 text-pink-400 mb-2" />
              <h3 className="text-sm font-medium text-text-primary">{s.text}</h3>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
