'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from './providers'
import { DashboardHeader } from './dashboard/dashboard-header'
import { DashboardSidebar } from './dashboard/dashboard-sidebar'
import { DashboardMain } from './dashboard/dashboard-main'
import { LoadingSpinner } from './ui/loading-spinner'

export function Dashboard() {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Simulate loading time for initial data fetch
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />
      <div className="flex">
        <DashboardSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <DashboardMain activeTab={activeTab} />
      </div>
    </div>
  )
} 