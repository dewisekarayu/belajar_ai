'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useChatStore } from '@/lib/store'
import { User, Mail, LogOut, MessageSquare, AtSign, Sparkles } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function ProfilePage() {
  const { sessions } = useChatStore()
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setUser(d.user))
      .catch(() => {})
      .finally(() => setLoadingUser(false))
  }, [])

  const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0)

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    localStorage.clear()
    window.location.href = '/login'
  }

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : null

  return (
    <div className="relative p-6 overflow-y-auto h-full">
      <div aria-hidden className="pointer-events-none fixed top-0 left-1/3 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl -z-10" />

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-2xl mx-auto">
        <motion.h1 variants={itemVariants} className="text-2xl font-bold tracking-tight text-text-primary mb-6">
          Profile
        </motion.h1>

        {/* User info card */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-2xl glass shadow-soft border border-border mb-6"
        >
          <div className="flex items-center gap-5 mb-6">
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-soft-lg ring-2 ring-white/20">
              {loadingUser ? (
                <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : initials ? (
                <span className="text-xl font-bold text-white">{initials}</span>
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {loadingUser ? (
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-border/60 rounded-md animate-pulse" />
                  <div className="h-3.5 w-40 bg-border/40 rounded-md animate-pulse" />
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-text-primary truncate">{user?.name || 'Unknown User'}</h2>
                  <p className="text-sm text-text-secondary flex items-center gap-1.5 truncate mt-0.5">
                    <Mail className="w-3.5 h-3.5 shrink-0" /> {user?.email}
                  </p>
                  {user?.username && (
                    <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                      <AtSign className="w-3 h-3" />{user.username}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-4 rounded-xl bg-accent-500/[0.06] border border-accent-500/10">
              <p className="text-2xl font-bold text-text-primary tabular-nums">{sessions.length}</p>
              <p className="text-xs text-text-secondary mt-0.5">Total Chats</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-accent-500/[0.06] border border-accent-500/10">
              <p className="text-2xl font-bold text-text-primary tabular-nums">{totalMessages}</p>
              <p className="text-xs text-text-secondary mt-0.5">Messages</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-accent-500/[0.06] border border-accent-500/10">
              <p className="text-2xl font-bold text-text-primary">Free</p>
              <p className="text-xs text-text-secondary mt-0.5">Plan</p>
            </div>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div variants={itemVariants}>
          <motion.button
            onClick={handleLogout}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-6 py-3 text-error bg-error/10 border border-error/10 rounded-xl hover:bg-error/15 hover:shadow-soft transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}
