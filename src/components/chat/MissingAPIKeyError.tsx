'use client'

import { Settings, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export function MissingAPIKeyError({ message }: { message?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-warning/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-warning" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">API Key Tidak Dikonfigurasi</h2>
        <p className="text-sm text-text-secondary mb-6 leading-relaxed">
          {message || 'Claude API Key belum dikonfigurasi.'}
          <br />
          Silakan tambahkan <code className="px-1.5 py-0.5 bg-pink-400/10 rounded text-pink-500 text-xs">CLAUDE_API_KEY</code> pada file <code className="px-1.5 py-0.5 bg-pink-400/10 rounded text-pink-500 text-xs">.env</code>.
        </p>
        <Link href="/settings"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-400 to-pink-300 text-white rounded-2xl font-medium hover:from-pink-500 hover:to-pink-400 transition-all shadow-soft active:scale-[0.98]">
          <Settings className="w-4 h-4" /> Buka Pengaturan AI
        </Link>
      </div>
    </div>
  )
}
