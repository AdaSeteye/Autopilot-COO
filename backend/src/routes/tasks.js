const express = require('express')
const { body, query, validationResult } = require('express-validator')
const { pool } = require('../config/database')
const { logger } = require('../utils/logger')

const router = express.Router()

// Get all tasks for user
router.get('/', [
  query('status').optional().isIn(['pending', 'in_progress', 'completed']),
  query('priority').optional().isIn(['low', 'medium', 'high']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const { status, priority, limit = 50, offset = 0 } = req.query
    const userId = req.user.userId

    let query = 'SELECT * FROM tasks WHERE user_id = ?'
    const params = [userId]

    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }

    if (priority) {
      query += ' AND priority = ?'
      params.push(priority)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit), parseInt(offset))

    const [tasks] = await pool.execute(query, params)

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM tasks WHERE user_id = ?'
    const countParams = [userId]

    if (status) {
      countQuery += ' AND status = ?'
      countParams.push(status)
    }

    if (priority) {
      countQuery += ' AND priority = ?'
      countParams.push(priority)
    }

    const [countResult] = await pool.execute(countQuery, countParams)
    const total = countResult[0].total

    res.json({
      tasks,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    })
  } catch (error) {
    logger.error('Get tasks error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get task by ID
router.get('/:id', async (req, res) => {
  try {
    const taskId = req.params.id
    const userId = req.user.userId

    const [tasks] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    )

    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }

    res.json({ task: tasks[0] })
  } catch (error) {
    logger.error('Get task error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create task
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('priority').isIn(['low', 'medium', 'high']),
  body('due_date').optional().isISO8601(),
  body('status').optional().isIn(['pending', 'in_progress', 'completed'])
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const { title, description, priority, due_date, status = 'pending' } = req.body
    const userId = req.user.userId

    const [result] = await pool.execute(
      'INSERT INTO tasks (user_id, title, description, priority, due_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [userId, title, description || null, priority, due_date || null, status]
    )

    const [newTask] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ?',
      [result.insertId]
    )

    logger.info(`Task created: ${title} for user ${userId}`)

    res.status(201).json({
      message: 'Task created successfully',
      task: newTask[0]
    })
  } catch (error) {
    logger.error('Create task error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update task
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('due_date').optional().isISO8601(),
  body('status').optional().isIn(['pending', 'in_progress', 'completed'])
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const taskId = req.params.id
    const userId = req.user.userId

    // Check if task exists and belongs to user
    const [existingTasks] = await pool.execute(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    )

    if (existingTasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const updates = req.body
    const updateFields = []
    const updateValues = []

    Object.keys(updates).forEach(key => {
      if (['title', 'description', 'priority', 'due_date', 'status'].includes(key)) {
        updateFields.push(`${key} = ?`)
        updateValues.push(updates[key])
      }
    })

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    updateFields.push('updated_at = NOW()')
    updateValues.push(taskId, userId)

    await pool.execute(
      `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      updateValues
    )

    const [updatedTask] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    )

    logger.info(`Task updated: ${taskId} for user ${userId}`)

    res.json({
      message: 'Task updated successfully',
      task: updatedTask[0]
    })
  } catch (error) {
    logger.error('Update task error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const taskId = req.params.id
    const userId = req.user.userId

    const [result] = await pool.execute(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }

    logger.info(`Task deleted: ${taskId} for user ${userId}`)

    res.json({ message: 'Task deleted successfully' })
  } catch (error) {
    logger.error('Delete task error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get task statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const userId = req.user.userId

    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN due_date < NOW() AND status != 'completed' THEN 1 ELSE 0 END) as overdue
      FROM tasks 
      WHERE user_id = ?
    `, [userId])

    res.json({ stats: stats[0] })
  } catch (error) {
    logger.error('Get task stats error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router