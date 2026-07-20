'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, User, AtSign, UserPlus, MessageSquare } from 'lucide-react'
import { notifySuccess, notifyError } from '@/components/notification/Toast'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', username: '', email: '', password: '', confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name || !form.username || !form.email || !form.password || !form.confirmPassword) {
      setError('Semua field wajib diisi')
      return
    }

    if (form.password.length < 8) {
      setError('Password minimal 8 karakter')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message)
        setLoading(false)
        return
      }

      notifySuccess('Registrasi berhasil! Silakan login.')
      router.push('/login')
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background mesh-gradient flex items-center justify-center p-4">
      <div className="absolute top-20 left-10 w-72 h-72 bg-pink-300/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-200/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10">
        <div className="glass rounded-3xl p-8 shadow-soft-lg">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-300 flex items-center justify-center shadow-soft">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Create Account</h1>
            <p className="text-sm text-text-secondary mt-1">Join AI Chat Premium today</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-xl text-sm text-error text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-primary">Nama Lengkap</label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input type="text" name="name" value={form.name} onChange={handleChange}
                  placeholder="John Doe" required
                  className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-pink-400 transition-colors" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary">Username</label>
              <div className="relative mt-1.5">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input type="text" name="username" value={form.username} onChange={handleChange}
                  placeholder="johndoe" required
                  className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-pink-400 transition-colors" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary">Email</label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com" required
                  className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-pink-400 transition-colors" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary">Password</label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange}
                  placeholder="Min 8 characters" required
                  className="w-full pl-10 pr-12 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-pink-400 transition-colors" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-pink-400/10 rounded-lg">
                  {showPassword ? <EyeOff className="w-4 h-4 text-text-secondary" /> : <Eye className="w-4 h-4 text-text-secondary" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary">Konfirmasi Password</label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                  placeholder="Repeat password" required
                  className="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-xl text-sm outline-none focus:border-pink-400 transition-colors" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-pink-400 to-pink-300 text-white rounded-xl font-medium hover:from-pink-500 hover:to-pink-400 transition-all shadow-soft disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Create Account
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-text-secondary mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-pink-400 hover:text-pink-500 font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
