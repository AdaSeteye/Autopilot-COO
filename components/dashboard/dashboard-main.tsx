'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

interface DashboardMainProps {
  activeTab: string
}

export function DashboardMain({ activeTab }: DashboardMainProps) {
  const renderOverview = () => (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2350</div>
            <p className="text-xs text-muted-foreground">
              +180.1% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active OKRs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12</div>
            <p className="text-xs text-muted-foreground">
              +19% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              +201 since last hour
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Priority Tasks</CardTitle>
            <CardDescription>
              AI-suggested tasks for maximum impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: 'Review Q4 OKR progress', priority: 'High', time: '2 hours' },
                { title: 'Prepare investor update', priority: 'Medium', time: '1 hour' },
                { title: 'Team standup meeting', priority: 'Low', time: '30 min' }
              ].map((task, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">{task.time}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    task.priority === 'High' ? 'bg-red-100 text-red-800' :
                    task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>
              Latest recommendations from your AI assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Revenue Opportunity</p>
                <p className="text-xs text-blue-700 mt-1">
                  Your SaaS metrics show a 15% increase in trial-to-paid conversion. Consider optimizing your onboarding flow.
                </p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900">Team Performance</p>
                <p className="text-xs text-green-700 mt-1">
                  Your team is completing 23% more tasks this week. Great momentum!
                </p>
              </div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-900">Action Required</p>
                <p className="text-xs text-yellow-700 mt-1">
                  You have 3 overdue invoices. Consider sending follow-up reminders.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderTasks = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Tasks</h2>
        <Button>Add Task</Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Task management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )

  const renderOKRs = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">OKRs</h2>
        <Button>Add OKR</Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">OKR tracking coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )

  const renderInvoices = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Invoices</h2>
        <Button>Create Invoice</Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Invoice management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )

  const renderAI = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">AI Assistant</h2>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">AI features coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )

  const renderCalendar = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Calendar</h2>
        <Button>Add Event</Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Calendar integration coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )

  const renderTeam = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Team</h2>
        <Button>Invite Member</Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Team management coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )

  const renderSettings = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Settings panel coming soon...</p>
        </CardContent>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'tasks':
        return renderTasks()
      case 'okrs':
        return renderOKRs()
      case 'invoices':
        return renderInvoices()
      case 'ai':
        return renderAI()
      case 'calendar':
        return renderCalendar()
      case 'team':
        return renderTeam()
      case 'settings':
        return renderSettings()
      default:
        return renderOverview()
    }
  }

  return (
    <div className="flex-1 bg-background">
      {renderContent()}
    </div>
  )
}