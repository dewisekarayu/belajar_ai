'use client'

import { useState, useEffect } from 'react'
import { useChatStore } from '@/lib/store'
import { User, Mail, MessageSquare, LogOut } from 'lucide-react'

export default function ProfilePage() {
  const { sessions } = useChatStore()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setUser(d.user))
      .catch(() => {})
  }, [])

  const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    localStorage.clear()
    window.location.href = '/login'
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Profile</h1>
        <div className="p-6 bg-surface border border-border rounded-2xl mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-300 flex items-center justify-center shadow-soft-lg">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{user?.name || 'Loading...'}</h2>
              <p className="text-sm text-text-secondary">{user?.email}</p>
              <p className="text-xs text-text-secondary mt-1">@{user?.username}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-pink-400/5 rounded-xl">
              <p className="text-2xl font-bold text-text-primary">{sessions.length}</p>
              <p className="text-xs text-text-secondary">Total Chats</p>
            </div>
            <div className="text-center p-4 bg-pink-400/5 rounded-xl">
              <p className="text-2xl font-bold text-text-primary">{totalMessages}</p>
              <p className="text-xs text-text-secondary">Messages</p>
            </div>
            <div className="text-center p-4 bg-pink-400/5 rounded-xl">
              <p className="text-2xl font-bold text-text-primary">Free</p>
              <p className="text-xs text-text-secondary">Plan</p>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  )
}
