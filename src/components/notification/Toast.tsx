'use client'

import { useEffect } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import { CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from 'lucide-react'

export function NotificationProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
          padding: '14px 18px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: 'var(--shadow-lg)',
          backdropFilter: 'blur(16px)',
        },
        success: {
          icon: <CheckCircle className="w-5 h-5 text-success" />,
        },
        error: {
          icon: <XCircle className="w-5 h-5 text-error" />,
        },
      }}
    />
  )
}

export function notifySuccess(message: string) {
  toast.success(message)
}

export function notifyError(message: string) {
  toast.error(message)
}

export function notifyWarning(message: string) {
  toast(message, { icon: <AlertTriangle className="w-5 h-5 text-warning" /> })
}

export function notifyInfo(message: string) {
  toast(message, { icon: <Info className="w-5 h-5 text-accent-500" /> })
}

export function notifyLoading(message: string) {
  return toast.loading(message, {
    icon: <Loader2 className="w-5 h-5 text-accent-500 animate-spin" />,
  })
}
