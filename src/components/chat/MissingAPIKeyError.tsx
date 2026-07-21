'use client'

import { Settings, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export function MissingAPIKeyError({ message }: { message?: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-warning/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-warning" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">API Key Not Configured</h2>
        <p className="text-sm text-text-secondary mb-7 leading-relaxed">
          {message || 'Provider API Key is not configured.'}
          <br />
          Please add the required API Key in your <code className="px-1.5 py-0.5 bg-accent-500/10 rounded text-accent-600 dark:text-accent-400 text-xs">.env</code> file.
        </p>
        <Link href="/settings"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent-600 text-white rounded-2xl font-medium hover:bg-accent-700 transition-all shadow-soft hover:shadow-md active:scale-[0.98]">
          <Settings className="w-4 h-4" /> Open Settings
        </Link>
      </div>
    </div>
  )
}
