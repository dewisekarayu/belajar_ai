'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore, useSettingsStore } from '@/lib/store'
import { useTranslation } from '@/lib/store/language'
import { MessageSquare, Brain, Zap, Globe, Sparkles, Send, Code, BookOpen, Lightbulb } from 'lucide-react'
import { motion } from 'framer-motion'

export function EmptyState() {
  const { t } = useTranslation()
  const { createSession, providerStatus } = useChatStore()
  const { defaultProvider, defaultModel } = useSettingsStore()
  const router = useRouter()
  const [input, setInput] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return t('goodMorning')
    if (hour < 18) return t('goodAfternoon')
    return t('goodEvening')
  }, [t])

  const suggestions = [
    { text: t('explainConcept'), icon: Brain, desc: t('explainConceptDesc') },
    { text: t('writeSomeCode'), icon: Code, desc: t('writeSomeCodeDesc') },
    { text: t('summarizeDocument'), icon: BookOpen, desc: t('summarizeDocumentDesc') },
    { text: t('brainstormIdeas'), icon: Lightbulb, desc: t('brainstormIdeasDesc') },
  ]

  const handleCreateAndSend = async (message?: string) => {
    if (isCreating) return
    setIsCreating(true)
    try {
      if (message) {
        sessionStorage.setItem('pending-message', message)
      }
      let provider = defaultProvider
      let model = defaultModel
      if (!providerStatus[provider]) {
        const enabled = Object.entries(providerStatus).filter(([_, v]) => v)
        provider = enabled.length > 0 ? enabled[0][0] : defaultProvider
        const { getModelsForProvider } = await import('@/lib/providers')
        const models = getModelsForProvider(provider as any)
        model = models[0]?.id || defaultModel
      }
      const sessionId = await createSession(provider, model)
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
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <motion.div
        className="max-w-xl w-full text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {/* Logo */}
        <motion.div
          className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-accent-600 flex items-center justify-center shadow-soft-lg"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <MessageSquare className="w-8 h-8 text-white" />
        </motion.div>

        {/* Greeting */}
        <h2 className="text-2xl font-semibold text-text-primary mb-1.5">
          {greeting}!
        </h2>
        <p className="text-text-secondary text-sm mb-8">
          {t('howCanIHelp')}
        </p>

        {/* Center input */}
        <form onSubmit={handleSubmit} className="relative mb-8">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={t('askAnything')}
            disabled={isCreating}
            className="w-full bg-surface border border-border rounded-2xl pl-5 pr-14 py-4 text-sm outline-none focus:border-accent-500 transition-all duration-200 shadow-soft placeholder:text-text-secondary/40 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isCreating}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-accent-600 text-white rounded-xl hover:bg-accent-700 transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Suggestion cards */}
        <div className="grid grid-cols-2 gap-3">
          {suggestions.map((s, i) => (
            <motion.button
              key={i}
              onClick={() => handleCreateAndSend(s.text)}
              disabled={isCreating}
              className="group p-4 bg-surface border border-border rounded-2xl text-left hover:border-accent-300 dark:hover:border-accent-700 hover:shadow-soft transition-all duration-200 disabled:opacity-50"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
            >
              <s.icon className="w-5 h-5 text-accent-500 mb-2 group-hover:text-accent-600 transition-colors" />
              <h3 className="text-sm font-medium text-text-primary">{s.text}</h3>
              <p className="text-xs text-text-secondary mt-0.5">{s.desc}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
