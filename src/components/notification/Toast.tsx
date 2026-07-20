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
          background: '#FFFFFF',
          color: '#2F2F35',
          borderRadius: '16px',
          border: '1px solid #F8D3E7',
          padding: '12px 16px',
          fontSize: '14px',
          boxShadow: '0 4px 15px -3px rgba(255, 181, 220, 0.15)',
        },
        success: {
          iconTheme: {
            primary: '#A7E8C5',
            secondary: '#FFFFFF',
          },
        },
        error: {
          iconTheme: {
            primary: '#F6A6B2',
            secondary: '#FFFFFF',
          },
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
  toast(message, { icon: <AlertTriangle className="w-4 h-4 text-warning" /> })
}

export function notifyInfo(message: string) {
  toast(message, { icon: <Info className="w-4 h-4 text-pink-400" /> })
}

export function notifyLoading(message: string) {
  return toast.loading(message, {
    icon: <Loader2 className="w-4 h-4 text-pink-400 animate-spin" />,
  })
}
