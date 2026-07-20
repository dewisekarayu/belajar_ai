'use client'

import { useChatStore, useSettingsStore, useUIStore } from '@/lib/store'
import { PROVIDER_INFO, getModelsForProvider } from '@/lib/providers'
import type { AIModel } from '@/lib/types'
import { Menu, Moon, Sun, ChevronDown, RefreshCw, AlertCircle } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'

export function Header() {
  const { activeSessionId, sidebarOpen, setSidebarOpen, sessions, providerStatus } = useChatStore()
  const { defaultProvider, defaultModel, updateSettings } = useSettingsStore()
  const { theme, setTheme } = useUIStore()
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState(defaultProvider)
  const [models, setModels] = useState<AIModel[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelError, setModelError] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const session = sessions.find(s => s.id === activeSessionId)
  const activeProvider = session?.provider || defaultProvider
  const activeModel = session?.model || defaultModel
  const providerInfo = PROVIDER_INFO[activeProvider as keyof typeof PROVIDER_INFO]

  const loadModels = useCallback(async (providerId: string) => {
    setLoadingModels(true)
    setModelError('')
    try {
      const res = await fetch(`/api/models?provider=${providerId}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setModels(data)
    } catch {
      setModelError('Gagal memuat daftar model')
      setModels(getModelsForProvider(providerId as any))
    } finally {
      setLoadingModels(false)
    }
  }, [])

  useEffect(() => {
    if (showModelDropdown) {
      loadModels(selectedProvider)
    }
  }, [showModelDropdown, selectedProvider, loadModels])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowModelDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelectModel = async (providerId: string, modelId: string) => {
    updateSettings({ defaultProvider: providerId, defaultModel: modelId })

    // Also update the active session's provider/model if there is one
    if (session) {
      try {
        await fetch(`/api/sessions/${session.id}`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: providerId, model: modelId }),
        })
        useChatStore.setState(state => ({
          sessions: state.sessions.map(s => s.id === session.id ? { ...s, provider: providerId, model: modelId } : s),
        }))
      } catch {
        // Silently fail - settings are already updated
      }
    }
    setShowModelDropdown(false)
  }

  const enabledProviders = Object.entries(PROVIDER_INFO).filter(([key]) => providerStatus[key] !== false)

  return (
    <header className="h-14 border-b border-border bg-surface/80 backdrop-blur-sm flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {!sidebarOpen && (
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-pink-400/10 rounded-xl transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-sm font-semibold text-text-primary">{session?.title || 'AI Chat Premium'}</h1>
          <p className="text-xs text-text-secondary">
            {providerInfo?.name || activeProvider} · {activeModel?.split('/').pop()?.replace(/-/g, ' ')}
            {providerStatus[activeProvider] === false && (
              <span className="ml-2 text-warning text-xs font-medium">Not Configured</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-pink-400/10 rounded-xl text-sm font-medium text-text-primary hover:bg-pink-400/15 transition-colors">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: providerInfo?.color }} />
            {activeModel?.split('/').pop()?.replace(/-/g, ' ')}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showModelDropdown && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-soft-lg border border-border z-50 overflow-hidden">
              <div className="flex border-b border-border">
                {enabledProviders.map(([key, info]) => (
                  <button key={key}
                    onClick={() => setSelectedProvider(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-colors ${
                      selectedProvider === key
                        ? 'text-pink-500 border-b-2 border-pink-400 bg-pink-400/5'
                        : 'text-text-secondary hover:text-text-primary hover:bg-pink-400/5'
                    }`}>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info.color }} />
                    {info.name}
                  </button>
                ))}
              </div>

              <div className="max-h-72 overflow-y-auto p-1">
                {loadingModels ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-text-secondary">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Memuat model...
                  </div>
                ) : modelError ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <AlertCircle className="w-5 h-5 text-error" />
                    <p className="text-sm text-text-secondary">{modelError}</p>
                    <button onClick={() => loadModels(selectedProvider)}
                      className="text-xs text-pink-400 hover:text-pink-500 font-medium flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" /> Muat Ulang
                    </button>
                  </div>
                ) : models.length === 0 ? (
                  <p className="text-center text-sm text-text-secondary py-8">Tidak ada model tersedia</p>
                ) : (
                  models.map(m => (
                    <button key={m.id}
                      onClick={() => handleSelectModel(selectedProvider, m.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                        activeModel === m.id && activeProvider === selectedProvider
                          ? 'bg-pink-400/10 text-text-primary font-medium'
                          : 'hover:bg-pink-400/5 text-text-secondary'
                      }`}>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PROVIDER_INFO[selectedProvider as keyof typeof PROVIDER_INFO]?.color }} />
                        <span>{m.name}</span>
                      </div>
                      <span className="text-xs opacity-40">
                        {m.contextWindow >= 1000000 ? `${m.contextWindow / 1000000}M` : `${m.contextWindow / 1000}K`} ctx
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 hover:bg-pink-400/10 rounded-xl transition-colors">
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>
    </header>
  )
}
