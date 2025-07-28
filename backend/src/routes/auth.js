const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const { query, validationResult } = require('express-validator')
const { pool } = require('../config/database')
const { logger } = require('../utils/logger')

const router = express.Router()

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later.' }
})

// Register
router.post('/register', authLimiter, [
  query('email').isEmail().normalizeEmail(),
  query('password').isLength({ min: 8 }),
  query('name').trim().isLength({ min: 2 })
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const { email, password, name } = req.body

    // Check if user exists
    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    )

    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (email, password, name, created_at) VALUES (?, ?, ?, NOW())',
      [email, hashedPassword, name]
    )

    // Generate JWT
    const token = jwt.sign(
      { userId: result.insertId, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    logger.info(`User registered: ${email}`)

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: result.insertId, email, name }
    })
  } catch (error) {
    logger.error('Registration error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Login
router.post('/login', authLimiter, [
  query('email').isEmail().normalizeEmail(),
  query('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() })
    }

    const { email, password } = req.body

    // Find user
    const [users] = await pool.execute(
      'SELECT id, email, password, name FROM users WHERE email = ?',
      [email]
    )

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = users[0]

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    logger.info(`User logged in: ${email}`)

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name }
    })
  } catch (error) {
    logger.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get current user
router.get('/me', async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, email, name, created_at FROM users WHERE id = ?',
      [req.user.userId]
    )

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user: users[0] })
  } catch (error) {
    logger.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' })
})

module.exports = router