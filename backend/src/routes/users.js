const express = require('express')
const { body, validationResult } = require('express-validator')
const { createClient } = require('@supabase/supabase-js')

const router = express.Router()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch user profile' })
    }

    res.json({ user: data })
  } catch (error) {
    console.error('Get user profile error:', error)
    res.status(500).json({ error: 'Failed to get user profile' })
  }
})

// Update user profile
router.put('/profile', [
  body('full_name').optional().trim().isLength({ min: 2, max: 100 }),
  body('avatar_url').optional().isURL(),
  body('subscription_tier').optional().isIn(['free', 'pro', 'enterprise'])
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const updates = req.body

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to update user profile' })
    }

    res.json({ user: data })
  } catch (error) {
    console.error('Update user profile error:', error)
    res.status(500).json({ error: 'Failed to update user profile' })
  }
})

module.exports = router