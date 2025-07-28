const express = require('express')
const { body, validationResult } = require('express-validator')
const { createClient } = require('@supabase/supabase-js')

const router = express.Router()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Get all OKRs for user
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('okrs')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch OKRs' })
    }

    res.json({ okrs: data })
  } catch (error) {
    console.error('Get OKRs error:', error)
    res.status(500).json({ error: 'Failed to get OKRs' })
  }
})

// Create new OKR
router.post('/', [
  body('objective').trim().isLength({ min: 1, max: 500 }),
  body('key_results').isArray({ min: 1, max: 5 }),
  body('key_results.*.description').trim().isLength({ min: 1, max: 200 }),
  body('key_results.*.target').isNumeric(),
  body('key_results.*.current').isNumeric(),
  body('quarter').isIn(['Q1', 'Q2', 'Q3', 'Q4']),
  body('year').isInt({ min: 2020, max: 2030 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { objective, key_results, quarter, year } = req.body

    const { data, error } = await supabase
      .from('okrs')
      .insert({
        user_id: req.user.id,
        objective,
        key_results,
        quarter,
        year,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to create OKR' })
    }

    res.status(201).json({ okr: data })
  } catch (error) {
    console.error('Create OKR error:', error)
    res.status(500).json({ error: 'Failed to create OKR' })
  }
})

module.exports = router