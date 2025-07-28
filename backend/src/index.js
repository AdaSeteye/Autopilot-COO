const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const compression = require('compression')
require('express-async-errors')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const taskRoutes = require('./routes/tasks')
const okrRoutes = require('./routes/okrs')
const invoiceRoutes = require('./routes/invoices')
const aiRoutes = require('./routes/ai')
const metricsRoutes = require('./routes/metrics')
const userRoutes = require('./routes/users')

const { errorHandler } = require('./middleware/errorHandler')
const { authMiddleware } = require('./middleware/auth')
const { logger } = require('./utils/logger')

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})
app.use('/api/', limiter)

// Body parsing middleware
app.use(compression())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/tasks', authMiddleware, taskRoutes)
app.use('/api/okrs', authMiddleware, okrRoutes)
app.use('/api/invoices', authMiddleware, invoiceRoutes)
app.use('/api/ai', authMiddleware, aiRoutes)
app.use('/api/metrics', authMiddleware, metricsRoutes)
app.use('/api/users', authMiddleware, userRoutes)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handling middleware
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
  logger.info(`Environment: ${process.env.NODE_ENV}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully')
  process.exit(0)
})

module.exports = app 