'use client'

export function AIThinkingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-pink-300 flex items-center justify-center flex-shrink-0 shadow-soft">
        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
      </div>
      <div className="bg-surface border border-border rounded-2xl px-4 py-3 shadow-soft">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm text-text-secondary">AI is thinking...</span>
        </div>
      </div>
    </div>
  )
}
