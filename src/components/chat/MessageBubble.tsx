'use client'

import { useState } from 'react'
import { cn, formatNumber } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Copy, Check, Star, Bookmark, Bot, User } from 'lucide-react'
import type { DBMessage } from '@/lib/store'

export function MessageBubble({ message }: { message: DBMessage }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('group flex gap-3 animate-fade-in', isUser ? 'justify-end' : 'justify-start')}>
      {isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-pink-300 flex items-center justify-center flex-shrink-0 shadow-soft">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={cn('relative max-w-[75%] rounded-2xl px-4 py-3 transition-all duration-200',
        isUser ? 'bg-gradient-to-r from-pink-400 to-pink-300 text-white' : 'bg-surface border border-border shadow-soft')}>

        {isAssistant && message.provider && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-pink-400 capitalize">{message.provider}</span>
            {message.model && <><span className="text-xs text-text-secondary">·</span><span className="text-xs text-text-secondary">{message.model?.split('/').pop()}</span></>}
          </div>
        )}

        <div className={cn('markdown-body text-sm leading-relaxed', isUser ? 'text-white' : 'text-text-primary')}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}
              components={{
                pre: ({ children }) => (
                  <div className="relative group/code my-3">
                    <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                      <button onClick={() => {
                        const code = typeof children === 'object' && children && 'props' in children ? (children as any).props.children : String(children)
                        copyToClipboard(String(code))
                      }} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white/70 hover:text-white">
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <pre className="!bg-[#1E1E2E] !rounded-xl overflow-x-auto">{children}</pre>
                  </div>
                ),
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '')
                  return match ? <code className={className} {...props}>{children}</code> :
                    <code className="bg-pink-400/10 px-1.5 py-0.5 rounded text-pink-500 text-[0.85em]" {...props}>{children}</code>
                },
              }}>
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {isAssistant && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => copyToClipboard(message.content)} className="p-1.5 hover:bg-pink-400/10 rounded-lg transition-colors" title="Copy">
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
