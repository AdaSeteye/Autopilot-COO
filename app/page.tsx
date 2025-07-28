'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/components/providers'
import { Dashboard } from '@/components/dashboard'
import { Auth } from '@/components/auth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function HomePage() {
  const { user, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return <Dashboard />
} 