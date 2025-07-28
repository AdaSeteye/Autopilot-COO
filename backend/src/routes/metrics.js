const express = require('express')
const { createClient } = require('@supabase/supabase-js')

const router = express.Router()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Get dashboard metrics
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id

    // Get task metrics
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)

    // Get OKR metrics
    const { data: okrs } = await supabase
      .from('okrs')
      .select('*')
      .eq('user_id', userId)

    // Get invoice metrics
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)

    // Calculate metrics
    const totalTasks = tasks?.length || 0
    const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0
    const pendingTasks = tasks?.filter(t => t.status === 'pending').length || 0
    const activeOKRs = okrs?.filter(o => o.status === 'active').length || 0
    const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0
    const pendingInvoices = invoices?.filter(inv => inv.status === 'pending').length || 0

    const metrics = {
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0
      },
      okrs: {
        active: activeOKRs,
        total: okrs?.length || 0
      },
      revenue: {
        total: totalRevenue,
        pendingInvoices
      }
    }

    res.json({ metrics })
  } catch (error) {
    console.error('Get metrics error:', error)
    res.status(500).json({ error: 'Failed to get metrics' })
  }
})

// Get task completion trends
router.get('/task-trends', async (req, res) => {
  try {
    const userId = req.user.id
    const { days = 30 } = req.query

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

    // Group tasks by date
    const taskTrends = tasks?.reduce((acc, task) => {
      const date = new Date(task.created_at).toDateString()
      if (!acc[date]) {
        acc[date] = { created: 0, completed: 0 }
      }
      acc[date].created++
      if (task.status === 'completed') {
        acc[date].completed++
      }
      return acc
    }, {}) || {}

    res.json({ trends: taskTrends })
  } catch (error) {
    console.error('Get task trends error:', error)
    res.status(500).json({ error: 'Failed to get task trends' })
  }
})

module.exports = router