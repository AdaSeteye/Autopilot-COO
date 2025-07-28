const jwt = require('jsonwebtoken')
const { logger } = require('../utils/logger')

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET environment variable not set')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' })
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' })
    } else {
      logger.error('Auth middleware error:', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}

module.exports = { authMiddleware }