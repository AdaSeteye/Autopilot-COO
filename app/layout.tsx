import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Autopilot COO - AI-Powered Business Operating System',
  description: 'An AI-powered dashboard that acts as a business operating system for solo founders or small teams — helping them plan, track, automate, and act intelligently.',
  keywords: 'AI, business, dashboard, automation, OKR, task management, solo founder',
  authors: [{ name: 'Autopilot COO Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Autopilot COO - AI-Powered Business Operating System',
    description: 'An AI-powered dashboard that acts as a business operating system for solo founders or small teams.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Autopilot COO - AI-Powered Business Operating System',
    description: 'An AI-powered dashboard that acts as a business operating system for solo founders or small teams.',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-background`}>
        <Providers>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
} 