'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChatStore, useSettingsStore } from '@/lib/store'
import { Send, Paperclip, Square, Image, FileText, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { notifyError } from '@/components/notification/Toast'

export function ChatInput({ sessionId, autoFocus }: { sessionId: string; autoFocus?: boolean }) {
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [attachments, setAttachments] = useState<{ name: string; type: string; size: number }[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const { addMessage, updateLastAssistant, sessions } = useChatStore()
  const settings = useSettingsStore()

  // Auto-focus and pick up pending messages from sessionStorage
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
    // Check for pending message (from EmptyState suggestion cards)
    const pending = sessionStorage.getItem('pending-message-' + sessionId)
    if (pending) {
      sessionStorage.removeItem('pending-message-' + sessionId)
      setInput(pending)
    }
  }, [sessionId, autoFocus])

  // Listen for suggestion card clicks
  useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent).detail?.text
      if (text) {
        setInput(text)
        textareaRef.current?.focus()
      }
    }
    window.addEventListener('chat-suggestion', handler)
    return () => window.removeEventListener('chat-suggestion', handler)
  }, [])

  const onDrop = useCallback((files: File[]) => {
    setAttachments(prev => [...prev, ...files.map(f => ({ name: f.name, type: f.type, size: f.size }))])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'], 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'text/markdown': ['.md'] } })

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px'
    }
  }, [input])

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return

    const userContent = input.trim()
    setInput('')
    setAttachments([])
    setIsGenerating(true)

    // Save user message to DB
    try {
      const userMsg = await fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: userContent }),
      }).then(r => r.json())

      addMessage(sessionId, userMsg)

      // Update session title if first message
      if (session.messages.length === 0) {
        const title = userContent.slice(0, 50) + (userContent.length > 50 ? '...' : '')
        await fetch(`/api/sessions/${sessionId}`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        })
        useChatStore.setState(state => ({
          sessions: state.sessions.map(s => s.id === sessionId ? { ...s, title } : s),
        }))
      }
    } catch {
      notifyError('Gagal menyimpan pesan')
    }

    // Create placeholder for assistant
    const tempId = 'temp-' + Date.now()
    addMessage(sessionId, {
      id: tempId, sessionId, role: 'assistant', content: '',
      provider: session.provider, model: session.model,
      tokenInput: null, tokenOutput: null, createdAt: new Date().toISOString(),
    })

    try {
      abortRef.current = new AbortController()
      const allMessages = [...session.messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })), { role: 'user', content: userContent }]

      const response = await fetch('/api/chat/stream', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          provider: session.provider,
          model: session.model,
          messages: allMessages,
          stream: true,
          options: { temperature: settings.temperature, topP: settings.topP, maxTokens: settings.maxTokens, systemPrompt: settings.systemPrompt || undefined },
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        if (err.type === 'missing_api_key') {
          updateLastAssistant(sessionId, `**${err.message}**\n\nSilakan konfigurasi API Key untuk provider **${session.provider}** di halaman Settings.`)
          return
        }
        if (err.type === 'rate_limited') {
          updateLastAssistant(sessionId, `**Kuota Habis**\n\n${err.message}\n\nCoba gunakan provider lain atau tunggu beberapa saat.`)
          return
        }
        if (err.type === 'invalid_key') {
          updateLastAssistant(sessionId, `**API Key Tidak Valid**\n\n${err.message}`)
          return
        }
        if (err.type === 'model_not_found') {
          updateLastAssistant(sessionId, `**Model Tidak Ditemukan**\n\n${err.message}`)
          return
        }
        if (err.type === 'forbidden') {
          updateLastAssistant(sessionId, `**Akses Ditolak**\n\n${err.message}`)
          return
        }
        throw new Error(err.message || 'Request failed')
      }

      const contentType = response.headers.get('content-type') || ''
      let fullText = ''

      if (contentType.includes('text/event-stream')) {
        // SSE streaming response (Claude)
        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          for (const line of chunk.split('\n').filter(l => l.trim())) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') break
              try {
                const parsed = JSON.parse(data)
                if (parsed.type === 'text' && parsed.content) {
                  fullText += parsed.content
                  updateLastAssistant(sessionId, fullText)
                } else if (parsed.type === 'error') {
                  updateLastAssistant(sessionId, `Error: ${parsed.message}`)
                  return
                }
              } catch {}
            }
          }
        }
      } else {
        // Plain JSON response (Groq, Gemini, OpenRouter, Cerebras, Mistral, DeepSeek)
        const result = await response.json()
        if (result.message) {
          fullText = result.message
          updateLastAssistant(sessionId, fullText)
        } else if (result.type === 'missing_api_key') {
          updateLastAssistant(sessionId, `**${result.message}**\n\nSilakan konfigurasi API Key untuk provider **${session.provider}** di halaman Settings.`)
          return
        } else if (result.type === 'rate_limited') {
          updateLastAssistant(sessionId, `**Kuota Habis**\n\n${result.message}\n\nCoba gunakan provider lain atau tunggu beberapa saat.`)
          return
        } else if (result.type === 'invalid_key') {
          updateLastAssistant(sessionId, `**API Key Tidak Valid**\n\n${result.message}`)
          return
        } else if (result.type === 'model_not_found') {
          updateLastAssistant(sessionId, `**Model Tidak Ditemukan**\n\n${result.message}`)
          return
        } else if (result.type === 'forbidden') {
          updateLastAssistant(sessionId, `**Akses Ditolak**\n\n${result.message}`)
          return
        }
      }

      // Save assistant message to DB
      if (fullText) {
        const assistantMsg = await fetch(`/api/sessions/${sessionId}/messages`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'assistant', content: fullText, provider: session.provider, model: session.model }),
        }).then(r => r.json())

        useChatStore.setState(state => ({
          sessions: state.sessions.map(s => {
            if (s.id !== sessionId) return s
            const msgs = s.messages.map(m => m.id === tempId ? assistantMsg : m)
            return { ...s, messages: msgs }
          }),
        }))
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        updateLastAssistant(sessionId, '(Dihentikan)')
      } else {
        updateLastAssistant(sessionId, `Error: ${error.message || 'Gagal mendapatkan respons'}`)
      }
    } finally {
      setIsGenerating(false)
      abortRef.current = null
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="border-t border-border bg-surface/80 backdrop-blur-sm p-4">
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {attachments.map((a, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-pink-400/10 rounded-xl text-sm">
              {a.type.startsWith('image/') ? <Image className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              <span className="truncate max-w-[120px]">{a.name}</span>
              <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
      <div {...getRootProps()} className={`relative ${isDragActive ? 'opacity-50' : ''}`}>
        <input {...getInputProps()} />
        <textarea ref={textareaRef} data-chat-input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Ketik pesan... (Shift+Enter untuk baris baru)" rows={1}
          className="w-full resize-none bg-white dark:bg-gray-800 border border-border rounded-2xl pl-4 pr-24 py-3.5 text-sm outline-none focus:border-pink-400 transition-all duration-200 shadow-soft placeholder:text-text-secondary/50"
          style={{ minHeight: '48px' }} />
      </div>
      <div className="flex items-center justify-between mt-2">
        <label className="p-2 hover:bg-pink-400/10 rounded-xl transition-colors cursor-pointer">
          <Paperclip className="w-4 h-4 text-text-secondary" />
          <input type="file" className="hidden" multiple onChange={e => {
            if (e.target.files) setAttachments(prev => [...prev, ...Array.from(e.target.files!).map(f => ({ name: f.name, type: f.type, size: f.size }))])
          }} />
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary/50">{sessions.find(s => s.id === sessionId)?.provider} · {sessions.find(s => s.id === sessionId)?.model?.split('/').pop()}</span>
          {isGenerating ? (
            <button onClick={() => abortRef.current?.abort()}
              className="p-2 bg-error/10 text-error rounded-xl hover:bg-error/20 transition-colors">
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSend} disabled={!input.trim() && attachments.length === 0}
              className="p-2 bg-gradient-to-r from-pink-400 to-pink-300 text-white rounded-xl hover:from-pink-500 hover:to-pink-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95">
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
