'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore, useSettingsStore, useUIStore } from '@/lib/store'
import { PROVIDER_INFO } from '@/lib/providers'
import type { AIModel } from '@/lib/types'
import {
  Settings, Palette, Brain, Sliders, Info, Moon, Sun, Monitor,
  RefreshCw, Keyboard, Shield, Trash2, Download, Bell
} from 'lucide-react'
import { notifySuccess } from '@/components/notification/Toast'

const menuItems = [
  { id: 'general', icon: Settings, label: 'General' },
  { id: 'appearance', icon: Palette, label: 'Appearance' },
  { id: 'provider', icon: Brain, label: 'AI Provider' },
  { id: 'models', icon: Sliders, label: 'Models' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'shortcuts', icon: Keyboard, label: 'Shortcuts' },
  { id: 'privacy', icon: Shield, label: 'Privacy' },
  { id: 'about', icon: Info, label: 'About' },
]

const shortcuts = [
  { keys: 'Enter', action: 'Send message' },
  { keys: 'Shift + Enter', action: 'New line' },
  { keys: 'Ctrl + N', action: 'New chat' },
  { keys: 'Ctrl + B', action: 'Toggle sidebar' },
  { keys: 'Ctrl + K', action: 'Search chats' },
]

const tabVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-accent-600' : 'bg-black/15 dark:bg-white/15'}`}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="w-5 h-5 bg-white rounded-full shadow absolute top-0.5"
        style={{ left: checked ? '22px' : '2px' }}
      />
    </button>
  )
}

export default function SettingsPage() {
  const { defaultProvider, defaultModel, temperature, maxTokens, topP, streaming, systemPrompt, updateSettings, loadSettings } = useSettingsStore()
  const { providerStatus, setProviderStatus } = useChatStore()
  const { theme: uiTheme, setTheme: setUITheme } = useUIStore()
  const [activeTab, setActiveTab] = useState('general')
  const [models, setModels] = useState<AIModel[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [language, setLanguageState] = useState('en')
  const [notifications, setNotificationsState] = useState({ sound: true, desktop: true, toast: true })

  useEffect(() => {
    const lang = localStorage.getItem('language')
    if (lang) setLanguageState(lang)
    const notif = localStorage.getItem('notifications')
    if (notif) {
      try { setNotificationsState(JSON.parse(notif)) } catch {}
    }
  }, [])

  const loadModels = useCallback(async (providerId: string) => {
    setLoadingModels(true)
    try {
      const res = await fetch(`/api/models?provider=${providerId}`, { credentials: 'include' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setModels(data)
    } catch {
      setModels([])
    } finally {
      setLoadingModels(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
    fetch('/api/providers', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const s: Record<string, boolean> = {}
          data.forEach((p: any) => { s[p.id] = p.configured })
          setProviderStatus(s)
        }
      }).catch(() => {})
    loadModels(defaultProvider)
  }, [])

  const providers = Object.values(PROVIDER_INFO).filter(p => p.enabled !== false)

  const handleProviderChange = async (providerId: string) => {
    if (providerStatus[providerId] === false) return
    setLoadingModels(true)
    try {
      const res = await fetch(`/api/models?provider=${providerId}`, { credentials: 'include' })
      if (res.ok) {
        const freshModels = await res.json()
        setModels(freshModels)
        await updateSettings({ defaultProvider: providerId, defaultModel: freshModels[0]?.id || '' })
        notifySuccess(`Provider changed to ${PROVIDER_INFO[providerId as keyof typeof PROVIDER_INFO]?.name}`)
      }
    } catch {} finally {
      setLoadingModels(false)
    }
  }

  const handleLanguageChange = (lang: string) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    notifySuccess('Language updated')
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    const updated = { ...notifications, [key]: value }
    setNotificationsState(updated)
    localStorage.setItem('notifications', JSON.stringify(updated))
  }

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all chat history? This cannot be undone.')) return
    try {
      await fetch('/api/sessions', { method: 'DELETE', credentials: 'include' })
      useChatStore.setState({ sessions: [] })
      notifySuccess('Chat history cleared')
    } catch {
      notifySuccess('Failed to clear history')
    }
  }

  const handleExportData = async () => {
    const { sessions } = useChatStore.getState()
    const data = JSON.stringify(sessions, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ai-chat-export.json'
    a.click()
    URL.revokeObjectURL(url)
    notifySuccess('Data exported successfully')
  }

  return (
    <div className="flex h-full">
      {/* Sidebar nav */}
      <div className="w-56 border-r border-border/60 bg-sidebar/60 backdrop-blur-xl p-4 flex-shrink-0">
        <h2 className="text-lg font-bold tracking-tight text-text-primary mb-5 px-2">Settings</h2>
        <nav className="space-y-0.5">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm transition-all"
            >
              {activeTab === item.id && (
                <motion.div
                  layoutId="settings-active-tab"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute inset-0 bg-accent-500/10 border border-accent-500/15 rounded-xl shadow-sm"
                />
              )}
              <item.icon className={cn('w-4 h-4 relative z-10', activeTab === item.id ? 'text-accent-600 dark:text-accent-400' : 'text-text-secondary')} />
              <span className={cn('relative z-10 text-sm', activeTab === item.id ? 'text-accent-600 dark:text-accent-400 font-medium' : 'text-text-secondary')}>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} variants={tabVariants} initial="hidden" animate="show" exit="exit">

              {/* General */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-text-primary tracking-tight">General</h3>
                    <p className="text-sm text-text-secondary mt-1">Manage your general preferences</p>
                  </div>
                  <div className="premium-card p-5 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
                          <RefreshCw className="w-4 h-4 text-accent-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">Streaming</p>
                          <p className="text-xs text-text-secondary mt-0.5">Show responses in real-time as they generate</p>
                        </div>
                      </div>
                      <Toggle checked={streaming} onChange={() => updateSettings({ streaming: !streaming })} />
                    </div>
                  </div>
                  <div className="premium-card p-5 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
                          <Bell className="w-4 h-4 text-accent-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-text-primary">Language</p>
                          <p className="text-xs text-text-secondary mt-0.5">Interface language (UI text)</p>
                        </div>
                      </div>
                      <select
                        value={language}
                        onChange={e => handleLanguageChange(e.target.value)}
                        className="px-3 py-2 bg-background/80 border border-border rounded-xl text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10 transition-all"
                      >
                        <option value="en">English</option>
                        <option value="id">Bahasa Indonesia</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-text-primary tracking-tight">Appearance</h3>
                    <p className="text-sm text-text-secondary mt-1">Customize how the application looks</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(['light', 'dark', 'system'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => { setUITheme(t); updateSettings({ theme: t }) }}
                        className={`p-5 rounded-2xl border-2 text-sm font-medium capitalize transition-all ${
                          uiTheme === t
                            ? 'border-accent-500 bg-accent-500/[0.06] shadow-soft'
                            : 'border-border hover:border-accent-300 dark:hover:border-accent-700 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                        }`}
                      >
                        {t === 'light' ? <Sun className="w-6 h-6 mx-auto mb-3 text-accent-500" /> : t === 'dark' ? <Moon className="w-6 h-6 mx-auto mb-3 text-accent-500" /> : <Monitor className="w-6 h-6 mx-auto mb-3 text-accent-500" />}
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Provider */}
              {activeTab === 'provider' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-text-primary tracking-tight">AI Provider</h3>
                    <p className="text-sm text-text-secondary mt-1">Select and configure your AI providers</p>
                  </div>
                  <div className="space-y-3">
                    {providers.map(p => {
                      const configured = providerStatus[p.id] !== false
                      const isSelected = defaultProvider === p.id
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleProviderChange(p.id)}
                          disabled={!configured}
                          className={`flex items-center gap-4 w-full p-4 rounded-2xl border-2 text-left transition-all ${
                            isSelected
                              ? 'border-accent-500/40 bg-accent-500/[0.06] shadow-soft'
                              : configured
                                ? 'border-border/60 hover:border-accent-300/40 dark:hover:border-accent-700/40 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] hover:shadow-sm'
                                : 'border-border/30 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-soft flex-shrink-0" style={{ backgroundColor: p.color }}>
                            {p.name[0]}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-semibold text-text-primary">{p.name}</p>
                            <p className="text-xs text-text-secondary mt-0.5 truncate">{p.description}</p>
                            {isSelected && defaultModel && (
                              <p className="text-[11px] mt-1.5 text-accent-600 dark:text-accent-400 font-medium truncate">
                                Model: {defaultModel.split('/').pop()?.replace(/-/g, ' ')}
                              </p>
                            )}
                          </div>
                          {!configured && <span className="text-xs px-2.5 py-1 bg-warning/10 text-warning rounded-lg font-medium whitespace-nowrap">API Key Required</span>}
                          {isSelected && configured && (
                            <div className="w-6 h-6 rounded-full bg-accent-600 flex items-center justify-center shadow-soft flex-shrink-0">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {loadingModels && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary px-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading models...
                    </div>
                  )}
                </div>
              )}

              {/* Models */}
              {activeTab === 'models' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-text-primary tracking-tight">Model Settings</h3>
                    <p className="text-sm text-text-secondary mt-1">Configure AI model parameters</p>
                  </div>
                  <div className="premium-card p-5 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
                          <Brain className="w-4 h-4 text-accent-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">Default Model</p>
                          <p className="text-xs text-text-secondary mt-0.5">Active provider: <span className="font-medium text-accent-600 dark:text-accent-400">{PROVIDER_INFO[defaultProvider as keyof typeof PROVIDER_INFO]?.name || defaultProvider}</span></p>
                        </div>
                      </div>
                      <button onClick={() => loadModels(defaultProvider)} className="text-xs text-accent-600 hover:text-accent-700 font-medium flex items-center gap-1.5 px-3 py-1.5 bg-accent-500/10 rounded-xl transition-colors">
                        <RefreshCw className={`w-3 h-3 ${loadingModels ? 'animate-spin' : ''}`} /> Refresh
                      </button>
                    </div>
                    {loadingModels ? (
                      <div className="flex items-center gap-2.5 px-4 py-3.5 bg-background/60 border border-border/60 rounded-xl text-sm text-text-secondary">
                        <RefreshCw className="w-4 h-4 animate-spin text-accent-500" /> Loading models...
                      </div>
                    ) : (
                      <select
                        value={defaultModel}
                        onChange={e => updateSettings({ defaultModel: e.target.value })}
                        className="w-full px-4 py-3 bg-background/80 border border-border/60 rounded-xl text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10 transition-all"
                      >
                        {models.length === 0 && <option value="">No models available for this provider</option>}
                        {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="premium-card p-5 rounded-2xl">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
                        <Sliders className="w-4 h-4 text-accent-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Temperature: <span className="text-accent-600">{temperature}</span></p>
                        <p className="text-xs text-text-secondary mt-0.5">Controls randomness. Lower = more focused, Higher = more creative.</p>
                      </div>
                    </div>
                    <input type="range" min="0" max="2" step="0.1" value={temperature}
                      onChange={e => updateSettings({ temperature: parseFloat(e.target.value) })} className="w-full accent-accent-600" />
                    <div className="flex justify-between text-[10px] text-text-secondary/50 mt-1 px-0.5">
                      <span>Precise</span>
                      <span>Balanced</span>
                      <span>Creative</span>
                    </div>
                  </div>
                  <div className="premium-card p-5 rounded-2xl">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
                        <Brain className="w-4 h-4 text-accent-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Max Tokens: <span className="text-accent-600">{maxTokens}</span></p>
                        <p className="text-xs text-text-secondary mt-0.5">Maximum length of the AI response.</p>
                      </div>
                    </div>
                    <input type="range" min="256" max="32768" step="256" value={maxTokens}
                      onChange={e => updateSettings({ maxTokens: parseInt(e.target.value) })} className="w-full accent-accent-600" />
                    <div className="flex justify-between text-[10px] text-text-secondary/50 mt-1 px-0.5">
                      <span>256</span>
                      <span>16K</span>
                      <span>32K</span>
                    </div>
                  </div>
                  <div className="premium-card p-5 rounded-2xl">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
                        <Sliders className="w-4 h-4 text-accent-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">Top P: <span className="text-accent-600">{topP}</span></p>
                        <p className="text-xs text-text-secondary mt-0.5">Nucleus sampling. Lower = more conservative outputs.</p>
                      </div>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={topP}
                      onChange={e => updateSettings({ topP: parseFloat(e.target.value) })} className="w-full accent-accent-600" />
                  </div>
                  <div className="premium-card p-5 rounded-2xl">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
                        <Keyboard className="w-4 h-4 text-accent-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">System Prompt</p>
                        <p className="text-xs text-text-secondary mt-0.5">Custom instructions for the AI to follow.</p>
                      </div>
                    </div>
                    <textarea value={systemPrompt} onChange={e => updateSettings({ systemPrompt: e.target.value })}
                      placeholder="You are a helpful assistant..." rows={4}
                      className="w-full px-4 py-3 bg-background/60 border border-border/60 rounded-xl text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10 resize-none transition-all placeholder:text-text-secondary/40" />
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-text-primary tracking-tight">Notifications</h3>
                    <p className="text-sm text-text-secondary mt-1">Manage your notification preferences</p>
                  </div>
                  <div className="space-y-3">
                    <div className="glass rounded-2xl p-5 shadow-soft flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary">Toast Notifications</p>
                        <p className="text-xs text-text-secondary mt-0.5">Show popup notifications for actions</p>
                      </div>
                      <Toggle checked={notifications.toast} onChange={() => handleNotificationChange('toast', !notifications.toast)} />
                    </div>
                    <div className="glass rounded-2xl p-5 shadow-soft flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary">Sound Effects</p>
                        <p className="text-xs text-text-secondary mt-0.5">Play sounds for message events</p>
                      </div>
                      <Toggle checked={notifications.sound} onChange={() => handleNotificationChange('sound', !notifications.sound)} />
                    </div>
                    <div className="glass rounded-2xl p-5 shadow-soft flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary">Desktop Notifications</p>
                        <p className="text-xs text-text-secondary mt-0.5">Browser push notifications</p>
                      </div>
                      <Toggle
                        checked={notifications.desktop}
                        onChange={() => {
                          handleNotificationChange('desktop', !notifications.desktop)
                          if (!notifications.desktop && 'Notification' in window) {
                            Notification.requestPermission()
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Shortcuts */}
              {activeTab === 'shortcuts' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-text-primary tracking-tight">Keyboard Shortcuts</h3>
                    <p className="text-sm text-text-secondary mt-1">Speed up your workflow with shortcuts</p>
                  </div>
                  <div className="glass rounded-2xl shadow-soft divide-y divide-border/60 overflow-hidden">
                    {shortcuts.map((s, i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-3.5">
                        <span className="text-sm text-text-primary">{s.action}</span>
                        <kbd className="px-2.5 py-1 bg-background border border-border rounded-lg text-xs font-mono text-text-secondary">{s.keys}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Privacy */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-text-primary tracking-tight">Privacy & Data</h3>
                    <p className="text-sm text-text-secondary mt-1">Manage your data and privacy</p>
                  </div>
                  <div className="space-y-3">
                    <div className="glass rounded-2xl p-5 shadow-soft flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary">Export Data</p>
                        <p className="text-xs text-text-secondary mt-0.5">Download all your chat history as JSON</p>
                      </div>
                      <button onClick={handleExportData} className="flex items-center gap-1.5 px-3.5 py-2 bg-accent-500/10 text-accent-600 dark:text-accent-400 rounded-xl text-sm font-medium hover:bg-accent-500/15 transition-all">
                        <Download className="w-4 h-4" /> Export
                      </button>
                    </div>
                    <div className="glass rounded-2xl p-5 shadow-soft flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-text-primary">Clear All History</p>
                        <p className="text-xs text-text-secondary mt-0.5">Permanently delete all chat sessions</p>
                      </div>
                      <button onClick={handleClearHistory} className="flex items-center gap-1.5 px-3.5 py-2 bg-error/10 text-error rounded-xl text-sm font-medium hover:bg-error/20 transition-all">
                        <Trash2 className="w-4 h-4" /> Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* About */}
              {activeTab === 'about' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-text-primary tracking-tight">About</h3>
                    <p className="text-sm text-text-secondary mt-1">Application information</p>
                  </div>
                  <div className="glass rounded-2xl p-6 shadow-soft">
                    <div className="flex items-center gap-4 mb-5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-soft">
                        <span className="text-white font-bold text-xl">AI</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-text-primary text-lg">AI Chat Premium</h4>
                        <p className="text-sm text-text-secondary mt-0.5">Version 1.0.0</p>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      Multi-provider AI Chat application with premium UI. Supports multiple AI providers through a unified, elegant interface designed for productivity and delight.
                    </p>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}
