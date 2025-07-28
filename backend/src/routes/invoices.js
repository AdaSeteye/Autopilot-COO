const express = require('express')
const { body, query, validationResult } = require('express-validator')
const { pool } = require('../config/database')
const { logger } = require('../utils/logger')

const router = express.Router()

// Get all invoices for user
router.get('/', [
  query('status').optional().isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  query('client_id').optional().isInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const { status, client_id, limit = 50, offset = 0 } = req.query
    const userId = req.user.userId

    let query = `
      SELECT i.*, c.name as client_name, c.email as client_email 
      FROM invoices i 
      LEFT JOIN clients c ON i.client_id = c.id 
      WHERE i.user_id = ?
    `
    const params = [userId]

    if (status) {
      query += ' AND i.status = ?'
      params.push(status)
    }

    if (client_id) {
      query += ' AND i.client_id = ?'
      params.push(client_id)
    }

    query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit), parseInt(offset))

    const [invoices] = await pool.execute(query, params)

    // Get invoice items for each invoice
    for (let invoice of invoices) {
      const [items] = await pool.execute(
        'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY created_at ASC',
        [invoice.id]
      )
      invoice.items = items
    }

    res.json({ invoices })
  } catch (error) {
    logger.error('Get invoices error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id
    const userId = req.user.userId

    const [invoices] = await pool.execute(`
      SELECT i.*, c.name as client_name, c.email as client_email, c.address as client_address 
      FROM invoices i 
      LEFT JOIN clients c ON i.client_id = c.id 
      WHERE i.id = ? AND i.user_id = ?
    `, [invoiceId, userId])

    if (invoices.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    const invoice = invoices[0]

    // Get invoice items
    const [items] = await pool.execute(
      'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY created_at ASC',
      [invoiceId]
    )

    invoice.items = items

    res.json({ invoice })
  } catch (error) {
    logger.error('Get invoice error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create invoice
router.post('/', [
  body('client_id').isInt(),
  body('invoice_number').trim().isLength({ min: 1, max: 50 }),
  body('issue_date').isISO8601(),
  body('due_date').isISO8601(),
  body('currency').isIn(['USD', 'EUR', 'GBP', 'CAD', 'AUD']),
  body('tax_rate').optional().isFloat({ min: 0, max: 100 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('items').isArray({ min: 1 }),
  body('items.*.description').trim().isLength({ min: 1, max: 200 }),
  body('items.*.quantity').isFloat({ min: 0.01 }),
  body('items.*.unit_price').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const { 
      client_id, 
      invoice_number, 
      issue_date, 
      due_date, 
      currency, 
      tax_rate = 0, 
      notes, 
      items 
    } = req.body
    const userId = req.user.userId

    // Verify client belongs to user
    const [clients] = await pool.execute(
      'SELECT id FROM clients WHERE id = ? AND user_id = ?',
      [client_id, userId]
    )

    if (clients.length === 0) {
      return res.status(404).json({ error: 'Client not found' })
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    const tax_amount = subtotal * (tax_rate / 100)
    const total = subtotal + tax_amount

    // Start transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Create invoice
      const [invoiceResult] = await connection.execute(`
        INSERT INTO invoices (
          user_id, client_id, invoice_number, issue_date, due_date, 
          currency, subtotal, tax_rate, tax_amount, total, notes, 
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', NOW(), NOW())
      `, [
        userId, client_id, invoice_number, issue_date, due_date,
        currency, subtotal, tax_rate, tax_amount, total, notes || null
      ])

      const invoiceId = invoiceResult.insertId

      // Create invoice items
      for (let item of items) {
        await connection.execute(`
          INSERT INTO invoice_items (
            invoice_id, description, quantity, unit_price, total, created_at
          ) VALUES (?, ?, ?, ?, ?, NOW())
        `, [invoiceId, item.description, item.quantity, item.unit_price, item.quantity * item.unit_price])
      }

      await connection.commit()

      // Fetch complete invoice with items
      const [newInvoice] = await pool.execute(`
        SELECT i.*, c.name as client_name, c.email as client_email 
        FROM invoices i 
        LEFT JOIN clients c ON i.client_id = c.id 
        WHERE i.id = ?
      `, [invoiceId])
      
      const [newItems] = await pool.execute(
        'SELECT * FROM invoice_items WHERE invoice_id = ?',
        [invoiceId]
      )
      
      newInvoice[0].items = newItems

      logger.info(`Invoice created: ${invoice_number} for user ${userId}`)

      res.status(201).json({
        message: 'Invoice created successfully',
        invoice: newInvoice[0]
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    logger.error('Create invoice error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update invoice status
router.patch('/:id/status', [
  body('status').isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const invoiceId = req.params.id
    const { status } = req.body
    const userId = req.user.userId

    const [result] = await pool.execute(
      'UPDATE invoices SET status = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
      [status, invoiceId, userId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Invoice not found' })
    }

    logger.info(`Invoice status updated: ${invoiceId} to ${status}`)

    res.json({ message: 'Invoice status updated successfully' })
  } catch (error) {
    logger.error('Update invoice status error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const invoiceId = req.params.id
    const userId = req.user.userId

    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Delete invoice items first
      await connection.execute('DELETE FROM invoice_items WHERE invoice_id = ?', [invoiceId])
      
      // Delete invoice
      const [result] = await connection.execute(
        'DELETE FROM invoices WHERE id = ? AND user_id = ?',
        [invoiceId, userId]
      )

      if (result.affectedRows === 0) {
        await connection.rollback()
        return res.status(404).json({ error: 'Invoice not found' })
      }

      await connection.commit()

      logger.info(`Invoice deleted: ${invoiceId} for user ${userId}`)

      res.json({ message: 'Invoice deleted successfully' })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    logger.error('Delete invoice error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get invoice analytics
router.get('/analytics/summary', async (req, res) => {
  try {
    const userId = req.user.userId

    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_invoices,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_invoices,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_invoices,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_invoices,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_invoices,
        SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as total_revenue,
        SUM(CASE WHEN status = 'sent' OR status = 'overdue' THEN total ELSE 0 END) as pending_revenue,
        AVG(total) as avg_invoice_value
      FROM invoices 
      WHERE user_id = ?
    `, [userId])

    res.json({ analytics: stats[0] })
  } catch (error) {
    logger.error('Get invoice analytics error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router