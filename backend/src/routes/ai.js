const express = require('express')
const { body, validationResult } = require('express-validator')
const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')

const router = express.Router()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Get AI suggestions
router.post('/suggestions', [
  body('context').trim().isLength({ min: 1, max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { context } = req.body

    // Get user's recent data for context
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.user.id)
      .limit(10)

    const { data: okrs } = await supabase
      .from('okrs')
      .select('*')
      .eq('user_id', req.user.id)
      .limit(5)

    const prompt = `
      As an AI business assistant, analyze the following context and provide actionable suggestions:
      
      User Context: ${context}
      
      Recent Tasks: ${JSON.stringify(tasks)}
      Current OKRs: ${JSON.stringify(okrs)}
      
      Provide 3 specific, actionable suggestions that would help this business owner improve their operations, productivity, or business outcomes.
    `

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert business consultant and AI assistant. Provide practical, actionable advice based on the user's business context."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    })

    const suggestions = completion.choices[0].message.content

    // Save suggestion to database
    await supabase
      .from('ai_suggestions')
      .insert({
        user_id: req.user.id,
        context,
        suggestion: suggestions,
        created_at: new Date().toISOString()
      })

    res.json({ suggestions })
  } catch (error) {
    console.error('AI suggestions error:', error)
    res.status(500).json({ error: 'Failed to generate suggestions' })
  }
})

// Generate task recommendations
router.post('/task-recommendations', async (req, res) => {
  try {
    // Get user's current tasks and OKRs
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'pending')

    const { data: okrs } = await supabase
      .from('okrs')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', 'active')

    const prompt = `
      Based on the user's current tasks and OKRs, suggest 3 priority tasks for today that would have the highest impact:
      
      Current Tasks: ${JSON.stringify(tasks)}
      Active OKRs: ${JSON.stringify(okrs)}
      
      For each suggested task, provide:
      1. Task title
      2. Estimated time (in hours)
      3. Priority level (High/Medium/Low)
      4. Brief reasoning for the recommendation
    `

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert productivity consultant. Analyze the user's current workload and OKRs to suggest the most impactful tasks for today."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 600,
      temperature: 0.7
    })

    const recommendations = completion.choices[0].message.content

    res.json({ recommendations })
  } catch (error) {
    console.error('Task recommendations error:', error)
    res.status(500).json({ error: 'Failed to generate task recommendations' })
  }
})

module.exports = router