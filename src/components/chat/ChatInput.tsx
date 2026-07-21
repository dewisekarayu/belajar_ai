'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChatStore, useSettingsStore } from '@/lib/store'
import { Send, Paperclip, Square, Image, FileText, X, Mic } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { notifyError } from '@/components/notification/Toast'

export function ChatInput({ sessionId, autoFocus }: { sessionId: string; autoFocus?: boolean }) {
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [attachments, setAttachments] = useState<{ name: string; type: string; size: number }[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const handleSendRef = useRef<() => void>(() => {})
  const retryTextRef = useRef<string>('')
  const { addMessage, updateLastAssistant, sessions } = useChatStore()
  const settings = useSettingsStore()

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
    const pending = sessionStorage.getItem('pending-message-' + sessionId)
    if (pending) {
      sessionStorage.removeItem('pending-message-' + sessionId)
      setInput(pending)
    }
  }, [sessionId, autoFocus])

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

  handleSendRef.current = () => {
    const text = retryTextRef.current
    if (text) {
      retryTextRef.current = ''
      handleSend(text)
    }
  }

  useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent).detail?.text
      if (text && !isGenerating) {
        retryTextRef.current = text
        setTimeout(() => handleSendRef.current(), 10)
      }
    }
    window.addEventListener('chat-retry', handler)
    return () => window.removeEventListener('chat-retry', handler)
  }, [isGenerating])

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

  const handleSend = async (overrideText?: string) => {
    const textToUse = overrideText || input
    if (!textToUse.trim() && attachments.length === 0) return
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return

    const userContent = textToUse.trim()
    setInput('')
    setAttachments([])
    setIsGenerating(true)

    try {
      const userMsg = await fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: userContent }),
      }).then(r => r.json())

      addMessage(sessionId, userMsg)

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
      notifyError('Failed to save message')
    }

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
          updateLastAssistant(sessionId, `Error: ${err.message}`)
          return
        }
        if (err.type === 'rate_limited') {
          updateLastAssistant(sessionId, `Error: ${err.message}`)
          return
        }
        if (err.type === 'no_credits') {
          updateLastAssistant(sessionId, `Error: ${err.message}`)
          return
        }
        if (err.type === 'invalid_key') {
          updateLastAssistant(sessionId, `Error: ${err.message}`)
          return
        }
        if (err.type === 'model_not_found') {
          updateLastAssistant(sessionId, `Error: ${err.message}`)
          return
        }
        if (err.type === 'forbidden') {
          updateLastAssistant(sessionId, `Error: ${err.message}`)
          return
        }
        if (err.type === 'request_too_large') {
          updateLastAssistant(sessionId, `Error: ${err.message}`)
          return
        }
        throw new Error(err.message || 'Request failed')
      }

      const contentType = response.headers.get('content-type') || ''
      let fullText = ''

      if (contentType.includes('text/event-stream')) {
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
        const result = await response.json()
        if (result.message) {
          fullText = result.message
          updateLastAssistant(sessionId, fullText)
        } else if (result.type === 'missing_api_key') {
          updateLastAssistant(sessionId, `Error: ${result.message}`)
          return
        } else if (result.type === 'rate_limited') {
          updateLastAssistant(sessionId, `Error: ${result.message}`)
          return
        } else if (result.type === 'no_credits') {
          updateLastAssistant(sessionId, `Error: ${result.message}`)
          return
        } else if (result.type === 'invalid_key') {
          updateLastAssistant(sessionId, `Error: ${result.message}`)
          return
        } else if (result.type === 'model_not_found') {
          updateLastAssistant(sessionId, `Error: ${result.message}`)
          return
        } else if (result.type === 'forbidden') {
          updateLastAssistant(sessionId, `Error: ${result.message}`)
          return
        } else if (result.type === 'request_too_large') {
          updateLastAssistant(sessionId, `Error: ${result.message}`)
          return
        }
      }

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
        updateLastAssistant(sessionId, '(Stopped)')
      } else {
        updateLastAssistant(sessionId, `Error: ${error.message || 'Failed to get response'}`)
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
    <div className="border-t border-border bg-surface/60 backdrop-blur-lg px-4 pt-3 pb-4">
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {attachments.map((a, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-accent-500/10 border border-accent-500/15 rounded-xl text-sm">
              {a.type.startsWith('image/') ? <Image className="w-4 h-4 text-accent-500" /> : <FileText className="w-4 h-4 text-accent-500" />}
              <span className="truncate max-w-[120px] text-text-secondary">{a.name}</span>
              <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="text-text-secondary hover:text-error transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div {...getRootProps()} className={`relative ${isDragActive ? 'opacity-50' : ''}`}>
        <input {...getInputProps()} />
        <div className="relative flex items-end gap-2 bg-background border border-border rounded-2xl focus-within:border-accent-500/50 focus-within:shadow-soft transition-all duration-150 px-4 py-2">
          <textarea ref={textareaRef} data-chat-input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Type a message... (Shift+Enter for new line)" rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-text-primary outline-none py-1.5 placeholder:text-text-secondary/40"
            style={{ minHeight: '28px', maxHeight: '200px' }} />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isGenerating ? (
              <button onClick={() => abortRef.current?.abort()}
                className="p-2 bg-error/10 text-error rounded-xl hover:bg-error/20 transition-colors">
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <>
                <label className="p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] rounded-xl transition-colors cursor-pointer text-text-secondary hover:text-text-primary">
                  <Paperclip className="w-4 h-4" />
                  <input type="file" className="hidden" multiple onChange={e => {
                    if (e.target.files) setAttachments(prev => [...prev, ...Array.from(e.target.files!).map(f => ({ name: f.name, type: f.type, size: f.size }))])
                  }} />
                </label>
                <button onClick={() => handleSend()} disabled={!input.trim() && attachments.length === 0}
                  className="p-2 bg-accent-600 text-white rounded-xl hover:bg-accent-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 shadow-soft">
                  <Send className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center mt-2">
        <span className="text-[10px] text-text-secondary/30">
          {sessions.find(s => s.id === sessionId)?.provider} · {sessions.find(s => s.id === sessionId)?.model?.split('/').pop()?.replace(/-/g, ' ')}
        </span>
      </div>
    </div>
  )
}
