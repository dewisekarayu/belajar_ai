import type { Metadata } from 'next'
import './globals.css'
import { NotificationProvider } from '@/components/notification/Toast'
import ThemeProvider from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'AI Chat Premium',
  description: 'Premium AI Chat with Pink Pastel Theme',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-text-primary antialiased">
        <ThemeProvider>
          <NotificationProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
