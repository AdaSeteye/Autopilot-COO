const express = require('express')
const { body, query, validationResult } = require('express-validator')
const { pool } = require('../config/database')
const { logger } = require('../utils/logger')

const router = express.Router()

// Get all OKRs for user
router.get('/', [
  query('status').optional().isIn(['draft', 'active', 'completed', 'archived']),
  query('period').optional().trim(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const { status, period, limit = 50, offset = 0 } = req.query
    const userId = req.user.userId

    let query = 'SELECT * FROM okrs WHERE user_id = ?'
    const params = [userId]

    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }

    if (period) {
      query += ' AND period = ?'
      params.push(period)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit), parseInt(offset))

    const [okrs] = await pool.execute(query, params)

    // Get key results for each OKR
    for (let okr of okrs) {
      const [keyResults] = await pool.execute(
        'SELECT * FROM key_results WHERE okr_id = ? ORDER BY created_at ASC',
        [okr.id]
      )
      okr.keyResults = keyResults
    }

    res.json({ okrs })
  } catch (error) {
    logger.error('Get OKRs error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get OKR by ID
router.get('/:id', async (req, res) => {
  try {
    const okrId = req.params.id
    const userId = req.user.userId

    const [okrs] = await pool.execute(
      'SELECT * FROM okrs WHERE id = ? AND user_id = ?',
      [okrId, userId]
    )

    if (okrs.length === 0) {
      return res.status(404).json({ error: 'OKR not found' })
    }

    const okr = okrs[0]

    // Get key results
    const [keyResults] = await pool.execute(
      'SELECT * FROM key_results WHERE okr_id = ? ORDER BY created_at ASC',
      [okrId]
    )

    okr.keyResults = keyResults

    res.json({ okr })
  } catch (error) {
    logger.error('Get OKR error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create OKR
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('period').trim().isLength({ min: 1, max: 50 }),
  body('start_date').isISO8601(),
  body('end_date').isISO8601(),
  body('status').optional().isIn(['draft', 'active', 'completed', 'archived']),
  body('keyResults').isArray({ min: 1, max: 10 }),
  body('keyResults.*.title').trim().isLength({ min: 1, max: 200 }),
  body('keyResults.*.description').optional().trim().isLength({ max: 500 }),
  body('keyResults.*.target_value').isNumeric(),
  body('keyResults.*.current_value').optional().isNumeric(),
  body('keyResults.*.unit').optional().trim().isLength({ max: 20 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const { title, description, period, start_date, end_date, status = 'draft', keyResults } = req.body
    const userId = req.user.userId

    // Start transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Create OKR
      const [okrResult] = await connection.execute(
        'INSERT INTO okrs (user_id, title, description, period, start_date, end_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [userId, title, description || null, period, start_date, end_date, status]
      )

      const okrId = okrResult.insertId

      // Create key results
      for (let kr of keyResults) {
        await connection.execute(
          'INSERT INTO key_results (okr_id, title, description, target_value, current_value, unit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [okrId, kr.title, kr.description || null, kr.target_value, kr.current_value || 0, kr.unit || null]
        )
      }

      await connection.commit()

      // Fetch complete OKR with key results
      const [newOkr] = await pool.execute('SELECT * FROM okrs WHERE id = ?', [okrId])
      const [newKeyResults] = await pool.execute('SELECT * FROM key_results WHERE okr_id = ?', [okrId])
      
      newOkr[0].keyResults = newKeyResults

      logger.info(`OKR created: ${title} for user ${userId}`)

      res.status(201).json({
        message: 'OKR created successfully',
        okr: newOkr[0]
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    logger.error('Create OKR error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update OKR
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('period').optional().trim().isLength({ min: 1, max: 50 }),
  body('start_date').optional().isISO8601(),
  body('end_date').optional().isISO8601(),
  body('status').optional().isIn(['draft', 'active', 'completed', 'archived'])
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const okrId = req.params.id
    const userId = req.user.userId

    // Check if OKR exists and belongs to user
    const [existingOkrs] = await pool.execute(
      'SELECT id FROM okrs WHERE id = ? AND user_id = ?',
      [okrId, userId]
    )

    if (existingOkrs.length === 0) {
      return res.status(404).json({ error: 'OKR not found' })
    }

    const updates = req.body
    const updateFields = []
    const updateValues = []

    Object.keys(updates).forEach(key => {
      if (['title', 'description', 'period', 'start_date', 'end_date', 'status'].includes(key)) {
        updateFields.push(`${key} = ?`)
        updateValues.push(updates[key])
      }
    })

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    updateFields.push('updated_at = NOW()')
    updateValues.push(okrId, userId)

    await pool.execute(
      `UPDATE okrs SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      updateValues
    )

    // Fetch updated OKR with key results
    const [updatedOkr] = await pool.execute('SELECT * FROM okrs WHERE id = ?', [okrId])
    const [keyResults] = await pool.execute('SELECT * FROM key_results WHERE okr_id = ?', [okrId])
    
    updatedOkr[0].keyResults = keyResults

    logger.info(`OKR updated: ${okrId} for user ${userId}`)

    res.json({
      message: 'OKR updated successfully',
      okr: updatedOkr[0]
    })
  } catch (error) {
    logger.error('Update OKR error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update key result progress
router.put('/:okrId/key-results/:krId', [
  body('current_value').isNumeric(),
  body('notes').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const { okrId, krId } = req.params
    const { current_value, notes } = req.body
    const userId = req.user.userId

    // Verify OKR belongs to user and key result belongs to OKR
    const [verification] = await pool.execute(`
      SELECT kr.id 
      FROM key_results kr 
      JOIN okrs o ON kr.okr_id = o.id 
      WHERE kr.id = ? AND o.id = ? AND o.user_id = ?
    `, [krId, okrId, userId])

    if (verification.length === 0) {
      return res.status(404).json({ error: 'Key result not found' })
    }

    await pool.execute(
      'UPDATE key_results SET current_value = ?, notes = ?, updated_at = NOW() WHERE id = ?',
      [current_value, notes || null, krId]
    )

    const [updatedKr] = await pool.execute('SELECT * FROM key_results WHERE id = ?', [krId])

    logger.info(`Key result updated: ${krId} for OKR ${okrId}`)

    res.json({
      message: 'Key result updated successfully',
      keyResult: updatedKr[0]
    })
  } catch (error) {
    logger.error('Update key result error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete OKR
router.delete('/:id', async (req, res) => {
  try {
    const okrId = req.params.id
    const userId = req.user.userId

    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Delete key results first
      await connection.execute('DELETE FROM key_results WHERE okr_id = ?', [okrId])
      
      // Delete OKR
      const [result] = await connection.execute(
        'DELETE FROM okrs WHERE id = ? AND user_id = ?',
        [okrId, userId]
      )

      if (result.affectedRows === 0) {
        await connection.rollback()
        return res.status(404).json({ error: 'OKR not found' })
      }

      await connection.commit()

      logger.info(`OKR deleted: ${okrId} for user ${userId}`)

      res.json({ message: 'OKR deleted successfully' })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    logger.error('Delete OKR error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get OKR analytics
router.get('/analytics/summary', async (req, res) => {
  try {
    const userId = req.user.userId

    const [okrStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_okrs,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_okrs,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_okrs,
        AVG(CASE WHEN o.status = 'completed' THEN 
          (SELECT AVG(kr.current_value / kr.target_value * 100) 
           FROM key_results kr WHERE kr.okr_id = o.id)
        ELSE NULL END) as avg_completion_rate
      FROM okrs o
      WHERE o.user_id = ?
    `, [userId])

    const [krStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_key_results,
        AVG(kr.current_value / kr.target_value * 100) as avg_progress,
        SUM(CASE WHEN kr.current_value >= kr.target_value THEN 1 ELSE 0 END) as completed_key_results
      FROM key_results kr
      JOIN okrs o ON kr.okr_id = o.id
      WHERE o.user_id = ?
    `, [userId])

    res.json({
      analytics: {
        okrs: okrStats[0],
        keyResults: krStats[0]
      }
    })
  } catch (error) {
    logger.error('Get OKR analytics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router