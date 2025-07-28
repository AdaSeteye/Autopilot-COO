const { logger } = require('../utils/logger')

const errorHandler = (err, req, res, next) => {
  logger.error('Error handler caught:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  // Default error
  let error = {
    message: 'Internal server error',
    status: 500
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed'
    error.status = 400
    error.details = Object.values(err.errors).map(val => val.message)
  }

  // Cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    error.message = 'Invalid ID format'
    error.status = 400
  }

  // Duplicate key errors
  if (err.code === 11000) {
    error.message = 'Duplicate field value'
    error.status = 409
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token'
    error.status = 401
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired'
    error.status = 401
  }

  // Database connection errors
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    error.message = 'Database connection lost'
    error.status = 503
  }

  if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    error.message = 'Database access denied'
    error.status = 503
  }

  // Rate limiting errors
  if (err.status === 429) {
    error.message = 'Too many requests'
    error.status = 429
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    delete err.stack
  }

  res.status(error.status).json({
    error: error.message,
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  })
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection:', err)
  // Close server & exit process
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err)
  // Close server & exit process
  process.exit(1)
})

module.exports = { errorHandler }