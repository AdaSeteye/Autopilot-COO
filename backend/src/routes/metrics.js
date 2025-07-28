const express = require('express')
const { query, validationResult } = require('express-validator')
const { pool } = require('../config/database')
const { logger } = require('../utils/logger')

const router = express.Router()

// Get dashboard metrics
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.userId

    // Get task metrics
    const [taskMetrics] = await pool.execute(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 ELSE 0 END) as overdue_tasks
      FROM tasks 
      WHERE user_id = ?
    `, [userId])

    // Get OKR metrics
    const [okrMetrics] = await pool.execute(`
      SELECT 
        COUNT(*) as total_okrs,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_okrs,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_okrs,
        AVG(CASE WHEN o.status IN ('active', 'completed') THEN 
          (SELECT AVG(kr.current_value / kr.target_value * 100) 
           FROM key_results kr WHERE kr.okr_id = o.id)
        ELSE NULL END) as avg_progress
      FROM okrs o
      WHERE o.user_id = ?
    `, [userId])

    // Get invoice metrics
    const [invoiceMetrics] = await pool.execute(`
      SELECT 
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as total_revenue,
        SUM(CASE WHEN status IN ('sent', 'overdue') THEN total ELSE 0 END) as pending_revenue,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_invoices,
        AVG(total) as avg_invoice_value
      FROM invoices 
      WHERE user_id = ?
    `, [userId])

    // Recent activity (last 7 days)
    const [recentActivity] = await pool.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as task_count
      FROM tasks 
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [userId])

    res.json({
      dashboard: {
        tasks: taskMetrics[0],
        okrs: okrMetrics[0],
        invoices: invoiceMetrics[0],
        recent_activity: recentActivity
      },
      generated_at: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Get dashboard metrics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get productivity metrics
router.get('/productivity', [
  query('period').optional().isIn(['week', 'month', 'quarter', 'year']),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const { period = 'month', start_date, end_date } = req.query
    const userId = req.user.userId

    let dateFilter = ''
    let dateParams = [userId]

    if (start_date && end_date) {
      dateFilter = 'AND created_at BETWEEN ? AND ?'
      dateParams.push(start_date, end_date)
    } else {
      switch (period) {
        case 'week':
          dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)'
          break
        case 'month':
          dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)'
          break
        case 'quarter':
          dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)'
          break
        case 'year':
          dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)'
          break
      }
    }

    // Task completion trends
    const [completionTrends] = await pool.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') as date,
        COUNT(*) as created_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        AVG(CASE WHEN status = 'completed' AND updated_at IS NOT NULL 
            THEN TIMESTAMPDIFF(HOUR, created_at, updated_at) 
            ELSE NULL END) as avg_completion_time_hours
      FROM tasks 
      WHERE user_id = ? ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, dateParams)

    // Priority distribution
    const [priorityDistribution] = await pool.execute(`
      SELECT 
        priority,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        ROUND(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) / COUNT(*) * 100, 2) as completion_rate
      FROM tasks 
      WHERE user_id = ? ${dateFilter}
      GROUP BY priority
    `, dateParams)

    // Daily productivity patterns
    const [dailyPatterns] = await pool.execute(`
      SELECT 
        DAYNAME(created_at) as day_of_week,
        COUNT(*) as tasks_created,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as tasks_completed,
        ROUND(AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100, 2) as completion_rate
      FROM tasks 
      WHERE user_id = ? ${dateFilter}
      GROUP BY DAYOFWEEK(created_at), DAYNAME(created_at)
      ORDER BY DAYOFWEEK(created_at)
    `, dateParams)

    res.json({
      productivity: {
        period: period,
        completion_trends: completionTrends,
        priority_distribution: priorityDistribution,
        daily_patterns: dailyPatterns
      },
      generated_at: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Get productivity metrics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get financial metrics
router.get('/financial', [
  query('period').optional().isIn(['month', 'quarter', 'year']),
  query('currency').optional().isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD'])
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const { period = 'month', currency } = req.query
    const userId = req.user.userId

    let dateFilter = ''
    let currencyFilter = currency ? 'AND currency = ?' : ''
    let params = [userId]

    if (currency) params.push(currency)

    switch (period) {
      case 'month':
        dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)'
        break
      case 'quarter':
        dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)'
        break
      case 'year':
        dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)'
        break
    }

    // Revenue trends
    const [revenueTrends] = await pool.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        currency,
        SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as revenue,
        SUM(CASE WHEN status IN ('sent', 'overdue') THEN total ELSE 0 END) as pending,
        COUNT(*) as invoice_count,
        AVG(total) as avg_value
      FROM invoices 
      WHERE user_id = ? ${dateFilter} ${currencyFilter}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), currency
      ORDER BY month ASC
    `, params)

    // Payment status breakdown
    const [paymentStatus] = await pool.execute(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total) as total_amount,
        currency
      FROM invoices 
      WHERE user_id = ? ${dateFilter} ${currencyFilter}
      GROUP BY status, currency
    `, params)

    // Client revenue breakdown
    const [clientRevenue] = await pool.execute(`
      SELECT 
        c.name as client_name,
        i.currency,
        COUNT(i.id) as invoice_count,
        SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END) as paid_amount,
        SUM(CASE WHEN i.status IN ('sent', 'overdue') THEN i.total ELSE 0 END) as pending_amount
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.user_id = ? ${dateFilter} ${currencyFilter}
      GROUP BY c.id, c.name, i.currency
      ORDER BY paid_amount DESC
      LIMIT 10
    `, params)

    res.json({
      financial: {
        period: period,
        currency: currency || 'all',
        revenue_trends: revenueTrends,
        payment_status: paymentStatus,
        top_clients: clientRevenue
      },
      generated_at: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Get financial metrics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get goal progress metrics
router.get('/goals', [
  query('period').optional().trim(),
  query('status').optional().isIn(['draft', 'active', 'completed', 'archived'])
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const { period, status } = req.query
    const userId = req.user.userId

    let periodFilter = period ? 'AND o.period = ?' : ''
    let statusFilter = status ? 'AND o.status = ?' : ''
    let params = [userId]

    if (period) params.push(period)
    if (status) params.push(status)

    // OKR completion rates
    const [okrProgress] = await pool.execute(`
      SELECT 
        o.id,
        o.title,
        o.period,
        o.status,
        o.start_date,
        o.end_date,
        COUNT(kr.id) as total_key_results,
        SUM(CASE WHEN kr.current_value >= kr.target_value THEN 1 ELSE 0 END) as completed_key_results,
        ROUND(AVG(kr.current_value / kr.target_value * 100), 2) as avg_progress,
        ROUND(SUM(CASE WHEN kr.current_value >= kr.target_value THEN 1 ELSE 0 END) / COUNT(kr.id) * 100, 2) as completion_rate
      FROM okrs o
      LEFT JOIN key_results kr ON o.id = kr.okr_id
      WHERE o.user_id = ? ${periodFilter} ${statusFilter}
      GROUP BY o.id, o.title, o.period, o.status, o.start_date, o.end_date
      ORDER BY o.created_at DESC
    `, params)

    // Key results by OKR
    const [keyResultsProgress] = await pool.execute(`
      SELECT 
        kr.id,
        kr.title,
        kr.target_value,
        kr.current_value,
        kr.unit,
        ROUND(kr.current_value / kr.target_value * 100, 2) as progress_percentage,
        o.title as okr_title,
        o.period
      FROM key_results kr
      JOIN okrs o ON kr.okr_id = o.id
      WHERE o.user_id = ? ${periodFilter} ${statusFilter}
      ORDER BY progress_percentage DESC
    `, params)

    // Progress trends over time
    const [progressTrends] = await pool.execute(`
      SELECT 
        DATE_FORMAT(o.created_at, '%Y-%m') as month,
        o.period,
        COUNT(DISTINCT o.id) as okrs_created,
        COUNT(kr.id) as key_results_created,
        SUM(CASE WHEN kr.current_value >= kr.target_value THEN 1 ELSE 0 END) as completed_key_results
      FROM okrs o
      LEFT JOIN key_results kr ON o.id = kr.okr_id
      WHERE o.user_id = ? ${periodFilter} ${statusFilter}
      GROUP BY DATE_FORMAT(o.created_at, '%Y-%m'), o.period
      ORDER BY month ASC
    `, params)

    res.json({
      goals: {
        period: period || 'all',
        status: status || 'all',
        okr_progress: okrProgress,
        key_results_progress: keyResultsProgress,
        progress_trends: progressTrends
      },
      generated_at: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Get goal metrics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Export data for external analysis
router.get('/export', [
  query('type').isIn(['tasks', 'okrs', 'invoices', 'all']),
  query('format').optional().isIn(['json', 'csv']),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const { type, format = 'json', start_date, end_date } = req.query
    const userId = req.user.userId

    let dateFilter = ''
    let dateParams = []

    if (start_date && end_date) {
      dateFilter = 'AND created_at BETWEEN ? AND ?'
      dateParams = [start_date, end_date]
    }

    const exportData = {}

    if (type === 'tasks' || type === 'all') {
      const [tasks] = await pool.execute(`
        SELECT * FROM tasks 
        WHERE user_id = ? ${dateFilter}
        ORDER BY created_at DESC
      `, [userId, ...dateParams])
      exportData.tasks = tasks
    }

    if (type === 'okrs' || type === 'all') {
      const [okrs] = await pool.execute(`
        SELECT o.*, 
               GROUP_CONCAT(CONCAT(kr.title, ':', kr.current_value, '/', kr.target_value) SEPARATOR '; ') as key_results
        FROM okrs o
        LEFT JOIN key_results kr ON o.id = kr.okr_id
        WHERE o.user_id = ? ${dateFilter}
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `, [userId, ...dateParams])
      exportData.okrs = okrs
    }

    if (type === 'invoices' || type === 'all') {
      const [invoices] = await pool.execute(`
        SELECT i.*, c.name as client_name, c.email as client_email
        FROM invoices i
        LEFT JOIN clients c ON i.client_id = c.id
        WHERE i.user_id = ? ${dateFilter}
        ORDER BY i.created_at DESC
      `, [userId, ...dateParams])
      exportData.invoices = invoices
    }

    logger.info(`Data export requested by user ${userId}: ${type} (${format})`)

    if (format === 'csv') {
      // Simple CSV conversion (in a real app, use a proper CSV library)
      let csv = ''
      Object.keys(exportData).forEach(dataType => {
        csv += `\n\n=== ${dataType.toUpperCase()} ===\n`
        if (exportData[dataType].length > 0) {
          const headers = Object.keys(exportData[dataType][0]).join(',')
          csv += headers + '\n'
          exportData[dataType].forEach(row => {
            const values = Object.values(row).map(val => 
              typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
            ).join(',')
            csv += values + '\n'
          })
        }
      })

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="export_${type}_${new Date().toISOString().split('T')[0]}.csv"`)
      res.send(csv)
    } else {
      res.json({
        export: exportData,
        metadata: {
          type,
          format,
          date_range: { start_date, end_date },
          exported_at: new Date().toISOString(),
          total_records: Object.values(exportData).reduce((sum, arr) => sum + arr.length, 0)
        }
      })
    }
  } catch (error) {
    logger.error('Export data error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router