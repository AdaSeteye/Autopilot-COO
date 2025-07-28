const express = require('express')
const { body, validationResult } = require('express-validator')
const { createClient } = require('@supabase/supabase-js')

const router = express.Router()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Get all tasks for user
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch tasks' })
    }

    res.json({ tasks: data })
  } catch (error) {
    console.error('Get tasks error:', error)
    res.status(500).json({ error: 'Failed to get tasks' })
  }
})

// Create new task
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim(),
  body('priority').isIn(['low', 'medium', 'high']),
  body('due_date').optional().isISO8601(),
  body('okr_id').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { title, description, priority, due_date, okr_id } = req.body

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: req.user.id,
        title,
        description,
        priority,
        due_date,
        okr_id,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to create task' })
    }

    res.status(201).json({ task: data })
  } catch (error) {
    console.error('Create task error:', error)
    res.status(500).json({ error: 'Failed to create task' })
  }
})

// Update task
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('status').optional().isIn(['pending', 'in_progress', 'completed']),
  body('due_date').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const updates = req.body

    // Check if task belongs to user
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single()

    if (fetchError || !existingTask) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to update task' })
    }

    res.json({ task: data })
  } catch (error) {
    console.error('Update task error:', error)
    res.status(500).json({ error: 'Failed to update task' })
  }
})

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Check if task belongs to user
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single()

    if (fetchError || !existingTask) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({ error: 'Failed to delete task' })
    }

    res.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Delete task error:', error)
    res.status(500).json({ error: 'Failed to delete task' })
  }
})

module.exports = router