const express = require('express')
const bcrypt = require('bcryptjs')
const { body, query, validationResult } = require('express-validator')
const { pool } = require('../config/database')
const { logger } = require('../utils/logger')

const router = express.Router()

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.userId

    const [users] = await pool.execute(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user: users[0] })
  } catch (error) {
    logger.error('Get user profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update user profile
router.put('/profile', [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const userId = req.user.userId
    const updates = req.body

    // Check if email is already taken (if being updated)
    if (updates.email) {
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [updates.email, userId]
      )

      if (existingUsers.length > 0) {
        return res.status(409).json({ error: 'Email already in use' })
      }
    }

    const updateFields = []
    const updateValues = []

    Object.keys(updates).forEach(key => {
      if (['name', 'email'].includes(key)) {
        updateFields.push(`${key} = ?`)
        updateValues.push(updates[key])
      }
    })

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    updateFields.push('updated_at = NOW()')
    updateValues.push(userId)

    await pool.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )

    const [updatedUser] = await pool.execute(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    )

    logger.info(`User profile updated: ${userId}`)

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser[0]
    })
  } catch (error) {
    logger.error('Update user profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Change password
router.put('/password', [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 }),
  body('confirm_password').custom((value, { req }) => {
    if (value !== req.body.new_password) {
      throw new Error('Password confirmation does not match password')
    }
    return true
  })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const { current_password, new_password } = req.body
    const userId = req.user.userId

    // Get current password hash
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(current_password, users[0].password)
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(new_password, 12)

    // Update password
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedNewPassword, userId]
    )

    logger.info(`Password changed for user: ${userId}`)

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    logger.error('Change password error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all clients for user
router.get('/clients', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const { limit = 50, offset = 0 } = req.query
    const userId = req.user.userId

    const [clients] = await pool.execute(
      'SELECT * FROM clients WHERE user_id = ? ORDER BY name ASC LIMIT ? OFFSET ?',
      [userId, parseInt(limit), parseInt(offset)]
    )

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM clients WHERE user_id = ?',
      [userId]
    )

    res.json({
      clients,
      pagination: {
        total: countResult[0].total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < countResult[0].total
      }
    })
  } catch (error) {
    logger.error('Get clients error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create client
router.post('/clients', [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim().isLength({ max: 20 }),
  body('address').optional().trim().isLength({ max: 500 }),
  body('company').optional().trim().isLength({ max: 100 }),
  body('notes').optional().trim().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const { name, email, phone, address, company, notes } = req.body
    const userId = req.user.userId

    // Check if client with same email already exists for this user
    if (email) {
      const [existingClients] = await pool.execute(
        'SELECT id FROM clients WHERE email = ? AND user_id = ?',
        [email, userId]
      )

      if (existingClients.length > 0) {
        return res.status(409).json({ error: 'Client with this email already exists' })
      }
    }

    const [result] = await pool.execute(
      'INSERT INTO clients (user_id, name, email, phone, address, company, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
      [userId, name, email || null, phone || null, address || null, company || null, notes || null]
    )

    const [newClient] = await pool.execute(
      'SELECT * FROM clients WHERE id = ?',
      [result.insertId]
    )

    logger.info(`Client created: ${name} for user ${userId}`)

    res.status(201).json({
      message: 'Client created successfully',
      client: newClient[0]
    })
  } catch (error) {
    logger.error('Create client error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update client
router.put('/clients/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim().isLength({ max: 20 }),
  body('address').optional().trim().isLength({ max: 500 }),
  body('company').optional().trim().isLength({ max: 100 }),
  body('notes').optional().trim().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const clientId = req.params.id
    const userId = req.user.userId
    const updates = req.body

    // Check if client exists and belongs to user
    const [existingClients] = await pool.execute(
      'SELECT id FROM clients WHERE id = ? AND user_id = ?',
      [clientId, userId]
    )

    if (existingClients.length === 0) {
      return res.status(404).json({ error: 'Client not found' })
    }

    // Check if email is already taken (if being updated)
    if (updates.email) {
      const [duplicateClients] = await pool.execute(
        'SELECT id FROM clients WHERE email = ? AND user_id = ? AND id != ?',
        [updates.email, userId, clientId]
      )

      if (duplicateClients.length > 0) {
        return res.status(409).json({ error: 'Client with this email already exists' })
      }
    }

    const updateFields = []
    const updateValues = []

    Object.keys(updates).forEach(key => {
      if (['name', 'email', 'phone', 'address', 'company', 'notes'].includes(key)) {
        updateFields.push(`${key} = ?`)
        updateValues.push(updates[key])
      }
    })

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    updateFields.push('updated_at = NOW()')
    updateValues.push(clientId, userId)

    await pool.execute(
      `UPDATE clients SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
      updateValues
    )

    const [updatedClient] = await pool.execute(
      'SELECT * FROM clients WHERE id = ? AND user_id = ?',
      [clientId, userId]
    )

    logger.info(`Client updated: ${clientId} for user ${userId}`)

    res.json({
      message: 'Client updated successfully',
      client: updatedClient[0]
    })
  } catch (error) {
    logger.error('Update client error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete client
router.delete('/clients/:id', async (req, res) => {
  try {
    const clientId = req.params.id
    const userId = req.user.userId

    // Check if client has any invoices
    const [invoices] = await pool.execute(
      'SELECT id FROM invoices WHERE client_id = ? AND user_id = ?',
      [clientId, userId]
    )

    if (invoices.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete client with existing invoices. Please delete or reassign invoices first.' 
      })
    }

    const [result] = await pool.execute(
      'DELETE FROM clients WHERE id = ? AND user_id = ?',
      [clientId, userId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Client not found' })
    }

    logger.info(`Client deleted: ${clientId} for user ${userId}`)

    res.json({ message: 'Client deleted successfully' })
  } catch (error) {
    logger.error('Delete client error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user activity log
router.get('/activity', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  query('type').optional().isIn(['task', 'okr', 'invoice', 'client'])
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const { limit = 50, offset = 0, type } = req.query
    const userId = req.user.userId

    // Simulate activity log by combining recent activities from different tables
    let activities = []

    // Get recent tasks
    if (!type || type === 'task') {
      const [tasks] = await pool.execute(
        'SELECT id, title, status, created_at, updated_at FROM tasks WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20',
        [userId]
      )
      
      activities = activities.concat(tasks.map(task => ({
        id: task.id,
        type: 'task',
        action: task.status === 'completed' ? 'completed' : 'updated',
        title: task.title,
        timestamp: task.updated_at || task.created_at,
        details: { status: task.status }
      })))
    }

    // Get recent OKRs
    if (!type || type === 'okr') {
      const [okrs] = await pool.execute(
        'SELECT id, title, status, created_at, updated_at FROM okrs WHERE user_id = ? ORDER BY updated_at DESC LIMIT 10',
        [userId]
      )
      
      activities = activities.concat(okrs.map(okr => ({
        id: okr.id,
        type: 'okr',
        action: okr.status === 'completed' ? 'completed' : 'updated',
        title: okr.title,
        timestamp: okr.updated_at || okr.created_at,
        details: { status: okr.status }
      })))
    }

    // Get recent invoices
    if (!type || type === 'invoice') {
      const [invoices] = await pool.execute(
        'SELECT id, invoice_number, status, total, currency, created_at, updated_at FROM invoices WHERE user_id = ? ORDER BY updated_at DESC LIMIT 10',
        [userId]
      )
      
      activities = activities.concat(invoices.map(invoice => ({
        id: invoice.id,
        type: 'invoice',
        action: invoice.status === 'paid' ? 'paid' : 'updated',
        title: `Invoice ${invoice.invoice_number}`,
        timestamp: invoice.updated_at || invoice.created_at,
        details: { status: invoice.status, amount: invoice.total, currency: invoice.currency }
      })))
    }

    // Get recent clients
    if (!type || type === 'client') {
      const [clients] = await pool.execute(
        'SELECT id, name, created_at, updated_at FROM clients WHERE user_id = ? ORDER BY updated_at DESC LIMIT 10',
        [userId]
      )
      
      activities = activities.concat(clients.map(client => ({
        id: client.id,
        type: 'client',
        action: 'updated',
        title: client.name,
        timestamp: client.updated_at || client.created_at,
        details: {}
      })))
    }

    // Sort by timestamp and apply pagination
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    const paginatedActivities = activities.slice(parseInt(offset), parseInt(offset) + parseInt(limit))

    res.json({
      activities: paginatedActivities,
      pagination: {
        total: activities.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < activities.length
      }
    })
  } catch (error) {
    logger.error('Get user activity error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete user account
router.delete('/account', [
  body('password').notEmpty(),
  body('confirmation').equals('DELETE')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const { password } = req.body
    const userId = req.user.userId

    // Verify password
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const isPasswordValid = await bcrypt.compare(password, users[0].password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Password is incorrect' })
    }

    // Start transaction to delete all user data
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Delete in order of foreign key dependencies
      await connection.execute('DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE user_id = ?)', [userId])
      await connection.execute('DELETE FROM invoices WHERE user_id = ?', [userId])
      await connection.execute('DELETE FROM key_results WHERE okr_id IN (SELECT id FROM okrs WHERE user_id = ?)', [userId])
      await connection.execute('DELETE FROM okrs WHERE user_id = ?', [userId])
      await connection.execute('DELETE FROM tasks WHERE user_id = ?', [userId])
      await connection.execute('DELETE FROM clients WHERE user_id = ?', [userId])
      await connection.execute('DELETE FROM users WHERE id = ?', [userId])

      await connection.commit()

      logger.info(`User account deleted: ${userId}`)

      res.json({ message: 'Account deleted successfully' })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    logger.error('Delete user account error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router