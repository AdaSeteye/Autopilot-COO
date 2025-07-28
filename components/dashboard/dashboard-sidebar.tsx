'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard,
  CheckSquare,
  Target,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut
} from "lucide-react"

const sidebarItems = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    active: true
  },
  {
    name: 'Tasks',
    icon: CheckSquare,
    href: '/tasks'
  },
  {
    name: 'OKRs',
    icon: Target,
    href: '/okrs'
  },
  {
    name: 'Invoices',
    icon: FileText,
    href: '/invoices'
  },
  {
    name: 'Clients',
    icon: Users,
    href: '/clients'
  },
  {
    name: 'Analytics',
    icon: BarChart3,
    href: '/analytics'
  }
]

interface DashboardSidebarProps {
  className?: string
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  return (
    <div className={cn("flex h-full w-64 flex-col bg-gray-50 dark:bg-gray-900", className)}>
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold">AutoPilot COO</h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-4 py-4">
        {sidebarItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.name}
              variant={item.active ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start",
                item.active && "bg-gray-200 dark:bg-gray-800"
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.name}
            </Button>
          )
        })}
      </nav>
      
      <div className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
        <Button variant="ghost" className="w-full justify-start">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  )
}