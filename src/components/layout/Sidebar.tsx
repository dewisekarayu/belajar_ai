'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore, useSettingsStore, useUIStore } from '@/lib/store'
import { PROVIDER_INFO } from '@/lib/providers'
import { cn } from '@/lib/utils'
import {
  MessageSquarePlus, Search, ChevronDown, ChevronRight, MoreHorizontal,
  Trash2, Edit3, Settings, User, Moon, Sun, X, Hash, LogOut
} from 'lucide-react'

export function Sidebar() {
  const router = useRouter()
  const { sessions, activeSessionId, sidebarOpen, searchQuery, setActiveSession,
    setSidebarOpen, setSearchQuery, deleteSession, renameSession, setSessions,
    createSession, providerStatus, setProviderStatus } = useChatStore()
  const { defaultProvider, defaultModel, loadSettings } = useSettingsStore()
  const { theme, setTheme } = useUIStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [contextMenu, setContextMenu] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadSettings()
    // Load sessions from DB
    fetch('/api/sessions', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setSessions(data))
      .catch(() => {})
    // Load provider status
    fetch('/api/providers', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        const status: Record<string, boolean> = {}
        data.forEach((p: any) => { status[p.id] = p.configured })
        setProviderStatus(status)
      })
      .catch(() => {})
  }, [])

  const filteredSessions = sessions
    .filter(s => !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const handleNewChat = async () => {
    if (isCreating) return
    setIsCreating(true)
    try {
      // Find first enabled provider
      const enabledProviders = Object.entries(providerStatus).filter(([_, v]) => v)
      const provider = enabledProviders.length > 0 ? enabledProviders[0][0] : defaultProvider
      const { getModelsForProvider } = await import('@/lib/providers')
      const models = getModelsForProvider(provider as any)
      const model = models[0]?.id || defaultModel
      const sessionId = await createSession(provider, model)
      if (sessionId) {
        router.push('/chat')
      }
    } catch (error) {
      console.error('Failed to create new chat:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const startRename = (id: string, title: string) => { setEditingId(id); setEditTitle(title); setContextMenu(null) }
  const confirmRename = () => { if (editingId && editTitle.trim()) renameSession(editingId, editTitle.trim()); setEditingId(null) }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    localStorage.clear()
    window.location.href = '/login'
  }

  const SessionItem = ({ session }: { session: typeof sessions[0] }) => {
    const pinfo = PROVIDER_INFO[session.provider as keyof typeof PROVIDER_INFO]
    const isConfigured = providerStatus[session.provider] !== false
    return (
      <div onClick={() => { setActiveSession(session.id); router.push('/chat') }}
        className={cn('group flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200',
          activeSessionId === session.id ? 'bg-pink-400/15 text-text-primary' : 'hover:bg-pink-400/5 text-text-secondary hover:text-text-primary')}>
        {editingId === session.id ? (
          <input value={editTitle} onChange={e => setEditTitle(e.target.value)} onBlur={confirmRename}
            onKeyDown={e => e.key === 'Enter' && confirmRename()}
            className="flex-1 bg-white border border-border rounded-lg px-2 py-1 text-sm outline-none focus:border-pink-400" autoFocus />
        ) : (
          <>
            <span className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: (pinfo?.color || '#ccc') + '20', color: pinfo?.color || '#ccc' }}>
              {session.provider[0].toUpperCase()}
            </span>
            <span className="flex-1 truncate text-sm">{session.title}</span>
            {!isConfigured && <span className="text-[10px] px-1.5 py-0.5 bg-warning/20 text-warning rounded-full">No Key</span>}
            <button onClick={e => { e.stopPropagation(); setContextMenu(contextMenu === session.id ? null : session.id) }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-pink-400/10 rounded-lg transition-opacity">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        {contextMenu === session.id && (
          <div className="absolute right-4 bottom-full mb-2 bg-white rounded-xl shadow-soft-lg border border-border p-1 z-50 w-40" onClick={e => e.stopPropagation()}>
            <button onClick={() => startRename(session.id, session.title)} className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-pink-400/5"><Edit3 className="w-3.5 h-3.5" /> Rename</button>
            <button onClick={() => { deleteSession(session.id); setContextMenu(null) }} className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <aside className={cn('fixed left-0 top-0 h-full bg-sidebar border-r border-border z-40 transition-all duration-300 flex flex-col',
      sidebarOpen ? 'w-72' : 'w-0 overflow-hidden')}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-pink-300 flex items-center justify-center">
            <Hash className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-text-primary">AI Chat</span>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-pink-400/10 rounded-lg"><X className="w-4 h-4" /></button>
      </div>

      <div className="p-3">
        <button onClick={handleNewChat} disabled={isCreating}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-400 to-pink-300 text-white rounded-xl font-medium text-sm hover:from-pink-500 hover:to-pink-400 transition-all duration-200 shadow-soft active:scale-[0.98] ${isCreating ? 'opacity-60 cursor-not-allowed' : ''}`}>
          <MessageSquarePlus className="w-4 h-4" /> New Chat
        </button>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari chat..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-border rounded-xl text-sm outline-none focus:border-pink-400 transition-colors placeholder:text-text-secondary/50" />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5" onClick={() => setContextMenu(null)}>
        {filteredSessions.map(s => <SessionItem key={s.id} session={s} />)}
        {filteredSessions.length === 0 && (
          <p className="text-center text-xs text-text-secondary/50 py-8">Belum ada chat</p>
        )}
      </nav>

      <div className="border-t border-border p-3 space-y-1">
        <button onClick={() => { const next = theme === 'light' ? 'dark' : 'light'; setTheme(next as any) }}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:bg-pink-400/5 rounded-xl transition-colors">
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </button>
        <a href="/settings" className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:bg-pink-400/5 rounded-xl transition-colors">
          <Settings className="w-4 h-4" /> Settings
        </a>
        <a href="/profile" className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:bg-pink-400/5 rounded-xl transition-colors">
          <User className="w-4 h-4" /> Profile
        </a>
        <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </aside>
  )
}
