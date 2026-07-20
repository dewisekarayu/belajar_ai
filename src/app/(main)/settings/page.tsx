'use client'

import { useEffect, useState, useCallback } from 'react'
import { useChatStore, useSettingsStore, useUIStore } from '@/lib/store'
import { PROVIDER_INFO } from '@/lib/providers'
import type { AIModel } from '@/lib/types'
import { Settings, Palette, Brain, Sliders, Info, Moon, Sun, Monitor, RefreshCw } from 'lucide-react'
import { notifySuccess } from '@/components/notification/Toast'

const menuItems = [
  { id: 'general', icon: Settings, label: 'General' },
  { id: 'appearance', icon: Palette, label: 'Appearance' },
  { id: 'provider', icon: Brain, label: 'AI Provider' },
  { id: 'models', icon: Sliders, label: 'Models' },
  { id: 'about', icon: Info, label: 'About' },
]

export default function SettingsPage() {
  const { defaultProvider, defaultModel, theme, temperature, maxTokens, topP, streaming, systemPrompt, updateSettings, loadSettings } = useSettingsStore()
  const { providerStatus, setProviderStatus } = useChatStore()
  const { theme: uiTheme, setTheme: setUITheme } = useUIStore()
  const [activeTab, setActiveTab] = useState('general')
  const [models, setModels] = useState<AIModel[]>([])
  const [loadingModels, setLoadingModels] = useState(false)

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
        const s: Record<string, boolean> = {}
        data.forEach((p: any) => { s[p.id] = p.configured })
        setProviderStatus(s)
      }).catch(() => {})
    loadModels(defaultProvider)
  }, [])

  const providers = Object.values(PROVIDER_INFO)

  const handleProviderChange = async (providerId: string) => {
    if (providerStatus[providerId] === false) return
    await loadModels(providerId)
    const m = models.length > 0 ? models : []
    await updateSettings({ defaultProvider: providerId, defaultModel: m[0]?.id || '' })
    notifySuccess(`Provider changed to ${PROVIDER_INFO[providerId as keyof typeof PROVIDER_INFO]?.name}`)
  }

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-border bg-sidebar p-4">
        <h2 className="text-lg font-semibold text-text-primary mb-4 px-2">Settings</h2>
        <nav className="space-y-1">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm transition-colors ${
                activeTab === item.id ? 'bg-pink-400/10 text-text-primary font-medium' : 'text-text-secondary hover:bg-pink-400/5'
              }`}>
              <item.icon className="w-4 h-4" /> {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-text-primary">General</h3>
              <div className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl">
                <div><p className="text-sm font-medium">Streaming</p><p className="text-xs text-text-secondary">Real-time response</p></div>
                <button onClick={() => updateSettings({ streaming: !streaming })}
                  className={`w-11 h-6 rounded-full transition-colors ${streaming ? 'bg-pink-400' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${streaming ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-text-primary">Appearance</h3>
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'system'] as const).map(t => (
                  <button key={t} onClick={() => { setUITheme(t); updateSettings({ theme: t }) }}
                    className={`p-4 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                      uiTheme === t ? 'border-pink-400 bg-pink-400/5' : 'border-border hover:border-pink-400/50'
                    }`}>
                    {t === 'light' ? <Sun className="w-5 h-5 mx-auto mb-2" /> : t === 'dark' ? <Moon className="w-5 h-5 mx-auto mb-2" /> : <Monitor className="w-5 h-5 mx-auto mb-2" />}
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'provider' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-text-primary">AI Provider</h3>
              <div className="space-y-2">
                {providers.map(p => {
                  const configured = providerStatus[p.id] !== false
                  return (
                    <button key={p.id} onClick={() => handleProviderChange(p.id)}
                      disabled={!configured}
                      className={`flex items-center gap-3 w-full p-4 rounded-xl border-2 text-left transition-all ${
                        defaultProvider === p.id ? 'border-pink-400 bg-pink-400/5' : configured ? 'border-border hover:border-pink-400/50' : 'border-border opacity-50 cursor-not-allowed'
                      }`}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: p.color }}>
                        {p.name[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-text-secondary">{p.description}</p>
                      </div>
                      {!configured && <span className="text-xs px-2 py-1 bg-warning/20 text-warning rounded-full font-medium">API Key Required</span>}
                      {defaultProvider === p.id && configured && (
                        <div className="w-5 h-5 rounded-full bg-pink-400 flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full" /></div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-text-primary">Model Settings</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Default Model</label>
                    <button onClick={() => loadModels(defaultProvider)} className="text-xs text-pink-400 hover:text-pink-500 flex items-center gap-1">
                      <RefreshCw className={`w-3 h-3 ${loadingModels ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                  </div>
                  {loadingModels ? (
                    <div className="mt-1.5 w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-text-secondary flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Memuat model...
                    </div>
                  ) : (
                    <select value={defaultModel} onChange={e => updateSettings({ defaultModel: e.target.value })}
                      className="mt-1.5 w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:border-pink-400">
                      {models.length === 0 && <option>Tidak ada model tersedia</option>}
                      {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Temperature: {temperature}</label>
                  <input type="range" min="0" max="2" step="0.1" value={temperature}
                    onChange={e => updateSettings({ temperature: parseFloat(e.target.value) })} className="mt-2 w-full accent-pink-400" />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Tokens: {maxTokens}</label>
                  <input type="range" min="256" max="32768" step="256" value={maxTokens}
                    onChange={e => updateSettings({ maxTokens: parseInt(e.target.value) })} className="mt-2 w-full accent-pink-400" />
                </div>
                <div>
                  <label className="text-sm font-medium">Top P: {topP}</label>
                  <input type="range" min="0" max="1" step="0.05" value={topP}
                    onChange={e => updateSettings({ topP: parseFloat(e.target.value) })} className="mt-2 w-full accent-pink-400" />
                </div>
                <div>
                  <label className="text-sm font-medium">System Prompt</label>
                  <textarea value={systemPrompt} onChange={e => updateSettings({ systemPrompt: e.target.value })}
                    placeholder="Custom system prompt..." rows={4}
                    className="mt-1.5 w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:border-pink-400 resize-none" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-text-primary">About</h3>
              <div className="p-6 bg-surface border border-border rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-300 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">AI</span>
                  </div>
                  <div><h4 className="font-semibold">AI Chat Premium</h4><p className="text-sm text-text-secondary">Version 1.0.0</p></div>
                </div>
                <p className="text-sm text-text-secondary">Multi-provider AI Chat with Pink Pastel Theme. Supports Claude, Gemini, Groq, OpenRouter, Cerebras, Mistral, and DeepSeek.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
