'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useChatStore } from '@/lib/store'
import { useTranslation } from '@/lib/store/language'
import { PROVIDER_INFO } from '@/lib/providers'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { MessageSquare, Cpu, Activity, TrendingUp, Sparkles } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { sessions } = useChatStore()
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/providers', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const s: Record<string, boolean> = {}
          data.forEach((p: any) => { s[p.id] = p.configured })
          setProviderStatus(s)
        }
      }).catch(() => {})
  }, [])

  const totalChats = sessions.length
  const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0)
  const configuredProviders = Object.values(providerStatus).filter(v => v).length

  const providerCounts = sessions.reduce((acc, s) => {
    acc[s.provider] = (acc[s.provider] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const providerData = Object.entries(providerCounts).map(([provider, count]) => ({
    name: PROVIDER_INFO[provider as keyof typeof PROVIDER_INFO]?.name || provider,
    value: count,
    color: PROVIDER_INFO[provider as keyof typeof PROVIDER_INFO]?.color || '#ccc',
  }))

  const weeklyData = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return { date: date.toLocaleDateString('en', { weekday: 'short' }), chats: Math.floor(Math.random() * 10) }
  }), [])

  const stats = [
    { label: t('totalChatsLabel'), value: totalChats, icon: MessageSquare, gradient: 'from-accent-500 to-accent-600' },
    { label: t('messagesLabel'), value: totalMessages, icon: Activity, gradient: 'from-accent-400 to-accent-500' },
    { label: t('providersActiveLabel'), value: configuredProviders, icon: Cpu, gradient: 'from-accent-500 to-accent-600' },
    { label: t('avgMessagesChatLabel'), value: totalChats > 0 ? Math.round(totalMessages / totalChats) : 0, icon: TrendingUp, gradient: 'from-accent-400 to-accent-500' },
  ]

  return (
    <div className="relative p-6 overflow-y-auto h-full">
      <div aria-hidden className="pointer-events-none fixed top-0 right-0 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl -z-10" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto"
      >
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">{t('dashboardTitle')}</h1>
          <p className="text-sm text-text-secondary mt-1">{t('dashboardDesc')}</p>
        </motion.div>

        {/* Stats grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="group relative p-5 rounded-2xl glass shadow-soft hover:shadow-soft-lg hover:border-accent-500/20 transition-all border border-border"
            >
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">{stat.label}</p>
                  <p className="text-xl font-bold text-text-primary tabular-nums">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl glass shadow-soft border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">{t('weeklyActivityLabel')}</h3>
              <TrendingUp className="w-4 h-4 text-accent-500" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'var(--accent)', opacity: 0.06 }}
                  contentStyle={{ borderRadius: 14, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', backdropFilter: 'blur(16px)' }}
                />
                <Bar dataKey="chats" fill="var(--accent)" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-6 rounded-2xl glass shadow-soft border border-border">
            <h3 className="text-sm font-semibold text-text-primary mb-4">{t('providerUsageLabel')}</h3>
            {providerData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={providerData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {providerData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 14, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', backdropFilter: 'blur(16px)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px] text-text-secondary text-sm gap-3">
                <Sparkles className="w-8 h-8 opacity-30" />
                <span>{t('startChattingStats')}</span>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
