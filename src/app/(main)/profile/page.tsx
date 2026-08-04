'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useChatStore } from '@/lib/store'
import { useTranslation } from '@/lib/store/language'
import { User, Mail, LogOut, MessageSquare, AtSign, Calendar, Edit3, Check, X, Save, Sparkles, Shield, BadgeCheck, Lock } from 'lucide-react'
import { notifySuccess, notifyError } from '@/components/notification/Toast'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function ProfilePage() {
  const { t, language } = useTranslation()
  const { sessions } = useChatStore()
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setUser(d.user)
        setEditName(d.user?.name || '')
        setEditUsername(d.user?.username || '')
      })
      .catch(() => {})
      .finally(() => setLoadingUser(false))
  }, [])

  const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {}
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  const handleSaveProfile = async () => {
    if (!editName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), username: editUsername.trim() || undefined }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || t('failedUpdateProfile'))
      }
      const data = await res.json()
      setUser(data.user)
      setEditName(data.user?.name || '')
      setEditUsername(data.user?.username || '')
      setEditing(false)
      notifySuccess(t('profileUpdated'))
    } catch (e: any) {
      notifyError(e.message || t('failedUpdateProfile'))
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditName(user?.name || '')
    setEditUsername(user?.username || '')
    setEditing(false)
  }

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : null

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { year: 'numeric', month: 'long' })
    : null

  return (
    <div className="relative p-6 overflow-y-auto h-full">
      <div aria-hidden className="pointer-events-none fixed top-0 left-1/3 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl -z-10" />
      <div aria-hidden className="pointer-events-none fixed bottom-0 right-1/4 w-80 h-80 bg-accent-400/4 rounded-full blur-3xl -z-10" />

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-2xl mx-auto">
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">{t('profile')}</h1>
            <p className="text-sm text-text-secondary mt-1">{t('manageAccountInfo')}</p>
          </div>
          {!editing ? (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-accent-500/10 text-accent-600 dark:text-accent-400 rounded-xl text-sm font-medium hover:bg-accent-500/15 transition-all border border-accent-500/20">
              <Edit3 className="w-3.5 h-3.5" /> {t('editProfile')}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={handleSaveProfile} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-accent-600 text-white rounded-xl text-sm font-medium hover:bg-accent-700 transition-all disabled:opacity-50">
                {saving ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                ) : <Save className="w-3.5 h-3.5" />}
                {t('save')}
              </button>
              <button onClick={handleCancelEdit}
                className="flex items-center gap-1.5 px-4 py-2 bg-black/[0.05] dark:bg-white/[0.06] text-text-secondary rounded-xl text-sm font-medium hover:bg-black/[0.08] dark:hover:bg-white/[0.08] transition-all">
                <X className="w-3.5 h-3.5" /> {t('cancel')}
              </button>
            </div>
          )}
        </motion.div>

        {/* Main Profile Card */}
        <motion.div variants={itemVariants}
          className="premium-card p-6 rounded-2xl mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-accent-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-5 relative z-10">
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-soft-lg ring-2 ring-white/20 dark:ring-white/10 shrink-0">
              {loadingUser ? (
                <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : initials ? (
                <span className="text-xl font-bold text-white">{initials}</span>
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-success border-2 border-surface flex items-center justify-center">
                <BadgeCheck className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              {loadingUser ? (
                <div className="space-y-2">
                  <div className="h-6 w-36 bg-border/60 rounded-md animate-pulse" />
                  <div className="h-4 w-48 bg-border/40 rounded-md animate-pulse" />
                </div>
              ) : editing ? (
                <div className="space-y-2.5">
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    placeholder="Full name"
                    className="w-full max-w-xs px-3 py-2 bg-background/80 border border-border/60 rounded-xl text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10 transition-all text-text-primary placeholder:text-text-secondary/40" />
                  <div className="flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5 text-text-secondary/60 shrink-0" />
                    <input value={editUsername} onChange={e => setEditUsername(e.target.value)}
                      placeholder="username"
                      className="flex-1 px-3 py-2 bg-background/80 border border-border/60 rounded-xl text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10 transition-all text-text-primary placeholder:text-text-secondary/40" />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-text-primary truncate">{user?.name || 'Unknown User'}</h2>
                  <p className="text-sm text-text-secondary flex items-center gap-1.5 truncate mt-0.5">
                    <Mail className="w-3.5 h-3.5 shrink-0" /> {user?.email}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {user?.username && (
                      <p className="text-xs text-text-secondary/70 flex items-center gap-1">
                        <AtSign className="w-3 h-3" />{user.username}
                      </p>
                    )}
                    {memberSince && (
                      <p className="text-xs text-text-secondary/70 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />{t('memberSinceLabel')} {memberSince}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: t('totalChatsLabel'), value: sessions.length, icon: MessageSquare },
            { label: t('messagesLabel'), value: totalMessages, icon: Sparkles },
            { label: t('plan'), value: 'Free', icon: Shield },
          ].map((stat, i) => (
            <div key={i} className="premium-card p-4 rounded-2xl text-center">
              <div className="w-9 h-9 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center mx-auto mb-2.5">
                <stat.icon className="w-4 h-4 text-accent-500" />
              </div>
              <p className="text-xl font-bold text-text-primary tabular-nums">{stat.value}</p>
              <p className="text-xs text-text-secondary mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Account Info */}
        <motion.div variants={itemVariants} className="premium-card rounded-2xl mb-6 overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Lock className="w-4 h-4 text-accent-500" /> {t('accountDetails')}
            </h3>
          </div>
          <div className="divide-y divide-border/40">
            {[
              { label: t('name'), value: user?.name || '-' },
              { label: t('username'), value: user?.username || '-' },
              { label: t('email'), value: user?.email || '-' },
              { label: t('memberSince'), value: memberSince || '-' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-text-secondary">{item.label}</span>
                <span className="text-sm font-medium text-text-primary">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 text-error bg-error/10 border border-error/10 rounded-xl hover:bg-error/15 hover:shadow-soft transition-all text-sm font-medium">
            <LogOut className="w-4 h-4" /> {t('signOut')}
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}
