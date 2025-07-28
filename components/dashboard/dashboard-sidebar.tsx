'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Target, 
  FileText, 
  BarChart3, 
  Settings, 
  Brain,
  Calendar,
  Users
} from 'lucide-react'

interface DashboardSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: Target },
  { id: 'okrs', label: 'OKRs', icon: BarChart3 },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'ai', label: 'AI Assistant', icon: Brain },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export function DashboardSidebar({ activeTab, setActiveTab }: DashboardSidebarProps) {
  return (
    <div className="w-64 bg-card border-r border-border min-h-screen p-4">
      <div className="space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start',
                activeTab === item.id && 'bg-primary text-primary-foreground'
              )}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}