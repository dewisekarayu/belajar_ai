'use client'

import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export function ScrollToBottom({ containerRef }: { containerRef: React.RefObject<HTMLDivElement> }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      setShow(scrollHeight - scrollTop - clientHeight > 100)
    }

    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [containerRef])

  const scrollToBottom = () => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' })
  }

  if (!show) return null

  return (
    <button onClick={scrollToBottom}
      className="fixed bottom-24 right-8 w-10 h-10 bg-surface border border-border rounded-full shadow-soft-lg flex items-center justify-center hover:shadow-soft transition-all z-20 animate-fade-in">
      <ChevronDown className="w-5 h-5 text-text-secondary" />
    </button>
  )
}
