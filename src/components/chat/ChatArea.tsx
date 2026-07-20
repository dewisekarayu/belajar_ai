'use client'

import { useRef, useEffect } from 'react'
import { useChatStore } from '@/lib/store'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { AIThinkingIndicator } from './AIThinkingIndicator'
import { EmptyState } from './EmptyState'
import { MessageSquare, Brain, Zap, Globe, Sparkles } from 'lucide-react'

export function ChatArea() {
  const { activeSessionId, sessions } = useChatStore()
  const session = sessions.find(s => s.id === activeSessionId)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages])

  if (!activeSessionId || !session) return <EmptyState />

  const lastMsg = session.messages[session.messages.length - 1]
  const showThinking = lastMsg?.role === 'user' || (lastMsg?.role === 'assistant' && lastMsg.content === '' && session.messages.length > 0)
  const isEmpty = session.messages.length === 0

  const suggestions = [
    { text: 'Jelaskan konsep AI', icon: Brain },
    { text: 'Buat kode React', icon: Zap },
    { text: 'Ringkas dokumen', icon: Sparkles },
    { text: 'Buat roadmap belajar', icon: Globe },
  ]

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="max-w-lg w-full text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-pink-400 to-pink-300 flex items-center justify-center shadow-soft-lg">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">AI Chat</h2>
              <p className="text-text-secondary mb-6">Halo! Ada yang bisa saya bantu hari ini?</p>
              <div className="grid grid-cols-2 gap-3">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      // Dispatch custom event for ChatInput to pick up
                      window.dispatchEvent(new CustomEvent('chat-suggestion', { detail: { text: s.text } }))
                    }}
                    className="p-4 bg-surface border border-border rounded-2xl text-left hover:shadow-soft hover:border-pink-400/30 transition-all duration-200"
                  >
                    <s.icon className="w-5 h-5 text-pink-400 mb-2" />
                    <h3 className="text-sm font-medium text-text-primary">{s.text}</h3>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {session.messages.map(message => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {showThinking && <AIThinkingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      <ChatInput sessionId={activeSessionId} autoFocus={isEmpty} />
    </div>
  )
}
