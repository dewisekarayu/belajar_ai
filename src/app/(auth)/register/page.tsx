'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, Eye, EyeOff, User, AtSign, UserPlus, MessageSquare, AlertCircle, Check,
} from 'lucide-react'
import { notifySuccess } from '@/components/notification/Toast'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
}

function getPasswordStrength(password: string) {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score // 0 - 4
}

const strengthMeta = [
  { label: '', color: 'bg-border' },
  { label: 'Lemah', color: 'bg-error' },
  { label: 'Sedang', color: 'bg-accent-400' },
  { label: 'Baik', color: 'bg-accent-500' },
  { label: 'Kuat', color: 'bg-accent-600' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', username: '', email: '', password: '', confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

  const strength = getPasswordStrength(form.password)
  const showMatch = form.confirmPassword.length > 0
  const isMatch = form.password === form.confirmPassword

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background mesh-gradient flex items-center justify-center p-4">
      <div aria-hidden className="pointer-events-none absolute top-20 left-10 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl animate-float" />
      <div aria-hidden className="pointer-events-none absolute bottom-10 right-10 w-96 h-96 bg-accent-400/8 rounded-full blur-3xl animate-float"
        style={{ animationDelay: '3s' }} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-md relative z-10"
      >
        <div className="glass rounded-3xl p-7 sm:p-9 shadow-soft-lg">
          <motion.div variants={itemVariants} className="text-center mb-8">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-soft">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Create Account</h1>
                        <p className="text-sm text-text-secondary mt-1.5">Join AI Chat and start creating</p>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div role="alert" className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-xl text-sm text-error">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-text-primary">Nama Lengkap</label>
                <div className="relative mt-1.5">
                  <input
                    id="name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    className="peer w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm text-text-primary outline-none transition-all duration-150 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10"
                  />
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary transition-colors peer-focus:text-accent-500" />
                </div>
              </div>

              <div>
                <label htmlFor="username" className="text-sm font-medium text-text-primary">Username</label>
                <div className="relative mt-1.5">
                  <input
                    id="username"
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="johndoe"
                    required
                    className="peer w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm text-text-primary outline-none transition-all duration-150 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10"
                  />
                  <AtSign className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary transition-colors peer-focus:text-accent-500" />
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="email" className="text-sm font-medium text-text-primary">Email</label>
              <div className="relative mt-1.5">
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  className="peer w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm text-text-primary outline-none transition-all duration-150 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10"
                />
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary transition-colors peer-focus:text-accent-500" />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="password" className="text-sm font-medium text-text-primary">Password</label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  required
                  className="peer w-full pl-10 pr-12 py-3 bg-background border border-border rounded-xl text-sm text-text-primary outline-none transition-all duration-150 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/10"
                />
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary transition-colors peer-focus:text-accent-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-secondary hover:text-accent-600 hover:bg-accent-500/10 rounded-lg transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? strengthMeta[strength].color : 'bg-border'}`}
                      />
                    ))}
                  </div>
                  {strength > 0 && (
                    <p className="text-xs text-text-secondary mt-1">{strengthMeta[strength].label}</p>
                  )}
                </div>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              <label htmlFor="confirmPassword" className="text-sm font-medium text-text-primary">Konfirmasi Password</label>
              <div className="relative mt-1.5">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  required
                  className={`peer w-full pl-10 pr-12 py-3 bg-background border rounded-xl text-sm text-text-primary outline-none transition-all duration-150 focus:ring-2 ${
                    showMatch && !isMatch
                      ? 'border-error/50 focus:border-error focus:ring-error/10'
                      : 'border-border focus:border-accent-500 focus:ring-accent-500/10'
                  }`}
                />
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary transition-colors peer-focus:text-accent-500" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-text-secondary hover:text-accent-600 hover:bg-accent-500/10 rounded-lg transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {showMatch && (
                <p className={`flex items-center gap-1 text-xs mt-1 ${isMatch ? 'text-accent-600' : 'text-error'}`}>
                  {isMatch && <Check className="w-3 h-3" />}
                  {isMatch ? 'Password cocok' : 'Password tidak cocok'}
                </p>
              )}
            </motion.div>

            <motion.button
              variants={itemVariants}
              type="submit"
              disabled={loading}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
                            className="relative w-full py-3 bg-accent-600 text-white rounded-xl font-medium shadow-soft transition-all hover:bg-accent-700 hover:shadow-md hover:shadow-accent-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Create Account
                </>
              )}
            </motion.button>
          </form>

          <motion.p variants={itemVariants} className="text-center text-sm text-text-secondary mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-accent-600 hover:text-accent-700 font-medium transition-colors">
              Sign In
            </Link>
          </motion.p>
        </div>
      </motion.div>
    </div>
  )
}