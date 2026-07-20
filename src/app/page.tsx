'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MessageSquare, Brain, Zap, Globe, Shield, Sparkles, ArrowRight } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

export default function LandingPage() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) setIsLoggedIn(true)
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    { icon: Brain, title: 'Multi-Provider AI', desc: 'Access Claude, Gemini, Groq, and more from one interface.' },
    { icon: Zap, title: 'Real-Time Streaming', desc: 'Watch AI responses appear in real-time with smooth streaming.' },
    { icon: Shield, title: 'Secure & Private', desc: 'Your API keys stay on the server. Never exposed to the frontend.' },
    { icon: Sparkles, title: 'Smart Formatting', desc: 'Beautiful markdown, syntax highlighting, and code blocks.' },
    { icon: Globe, title: 'Cloud Sync', desc: 'Your conversations sync across devices seamlessly.' },
  ]

  const stats = [
    { value: '7+', label: 'AI Providers' },
    { value: '20+', label: 'Models' },
    { value: '100K+', label: 'Context Window' },
    { value: '99.9%', label: 'Uptime' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'glass shadow-soft' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-pink-300 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-text-primary">AI Chat</span>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/chat"
                className="px-4 py-2 bg-gradient-to-r from-pink-400 to-pink-300 text-white text-sm font-medium rounded-xl hover:from-pink-500 hover:to-pink-400 transition-all shadow-soft">
                Open Chat
              </Link>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
                  Sign In
                </Link>
                <Link href="/register"
                  className="px-4 py-2 bg-gradient-to-r from-pink-400 to-pink-300 text-white text-sm font-medium rounded-xl hover:from-pink-500 hover:to-pink-400 transition-all shadow-soft">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 px-6 mesh-gradient overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-300/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-200/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />

        <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 bg-pink-400/10 rounded-full text-sm text-pink-500 font-medium mb-6">
            <Sparkles className="w-4 h-4" /> Premium AI Chat Experience
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-bold text-text-primary mb-6 leading-tight">
            Chat with AI,
            <br />
            <span className="bg-gradient-to-r from-pink-400 to-pink-300 bg-clip-text text-transparent">Beautifully</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="text-lg text-text-secondary mb-8 max-w-2xl mx-auto">
            Access the most powerful AI models through one elegant interface.
          </motion.p>
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-4">
            <Link href={isLoggedIn ? '/chat' : '/register'}
              className="px-8 py-3.5 bg-gradient-to-r from-pink-400 to-pink-300 text-white font-medium rounded-2xl hover:from-pink-500 hover:to-pink-400 transition-all shadow-soft-lg flex items-center gap-2 group">
              {isLoggedIn ? 'Open Chat' : 'Start Chatting'}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <section className="py-16 px-6 border-y border-border bg-surface/50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
              <p className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-pink-300 bg-clip-text text-transparent">{stat.value}</p>
              <p className="text-sm text-text-secondary mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-primary mb-3">Powerful Features</h2>
            <p className="text-text-secondary">Everything you need for an exceptional AI chat experience</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-6 bg-surface border border-border rounded-2xl hover:shadow-soft-lg transition-all group cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-300 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{f.title}</h3>
                <p className="text-sm text-text-secondary">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-border bg-surface/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-pink-400 to-pink-300 flex items-center justify-center">
              <MessageSquare className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-text-primary">AI Chat Premium</span>
          </div>
          <p className="text-xs text-text-secondary">Pink Pastel Theme</p>
        </div>
      </footer>
    </div>
  )
}
