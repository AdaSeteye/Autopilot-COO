const express = require('express')
const { body, validationResult } = require('express-validator')
const { createClient } = require('@supabase/supabase-js')

const router = express.Router()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Get all invoices for user
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch invoices' })
    }

    res.json({ invoices: data })
  } catch (error) {
    console.error('Get invoices error:', error)
    res.status(500).json({ error: 'Failed to get invoices' })
  }
})

// Create new invoice
router.post('/', [
  body('client_name').trim().isLength({ min: 1, max: 100 }),
  body('amount').isFloat({ min: 0 }),
  body('description').optional().trim(),
  body('due_date').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { client_name, amount, description, due_date } = req.body

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        user_id: req.user.id,
        client_name,
        amount,
        description,
        due_date,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to create invoice' })
    }

    res.status(201).json({ invoice: data })
  } catch (error) {
    console.error('Create invoice error:', error)
    res.status(500).json({ error: 'Failed to create invoice' })
  }
})

module.exports = router