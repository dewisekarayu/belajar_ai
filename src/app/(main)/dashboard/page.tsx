'use client'

import { useEffect, useState } from 'react'
import { useChatStore } from '@/lib/store'
import { PROVIDER_INFO } from '@/lib/providers'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { MessageSquare, Cpu, Activity, DollarSign } from 'lucide-react'

export default function DashboardPage() {
  const { sessions } = useChatStore()
  const [providerStatus, setProviderStatus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/providers', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        const s: Record<string, boolean> = {}
        data.forEach((p: any) => { s[p.id] = p.configured })
        setProviderStatus(s)
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

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return { date: date.toLocaleDateString('en', { weekday: 'short' }), chats: Math.floor(Math.random() * 10) }
  })

  const stats = [
    { label: 'Total Chats', value: totalChats, icon: MessageSquare, color: 'from-pink-400 to-pink-300' },
    { label: 'Messages', value: totalMessages, icon: Activity, color: 'from-pink-300 to-pink-200' },
    { label: 'Providers Active', value: configuredProviders, icon: Cpu, color: 'from-pink-400 to-pink-300' },
    { label: 'Sessions', value: totalChats, icon: DollarSign, color: 'from-pink-300 to-pink-200' },
  ]

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="p-5 bg-surface border border-border rounded-2xl hover:shadow-soft transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">{stat.label}</p>
                  <p className="text-xl font-bold text-text-primary">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 bg-surface border border-border rounded-2xl">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Weekly Activity</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F8D3E7" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F8D3E7' }} />
                <Bar dataKey="chats" fill="#FFB5DC" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-6 bg-surface border border-border rounded-2xl">
            <h3 className="text-sm font-semibold text-text-primary mb-4">Provider Usage</h3>
            {providerData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={providerData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {providerData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #F8D3E7' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-text-secondary text-sm">Mulai chat untuk melihat statistik</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
