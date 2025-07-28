const winston = require('winston')
const path = require('path')

// Create logs directory if it doesn't exist
const fs = require('fs')
const logDir = 'logs'
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`
    
    if (stack) {
      log += `\n${stack}`
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`
    }
    
    return log
  })
)

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    // Write error logs to error.log
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log')
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log')
    })
  ]
})

// If we're not in production, also log to console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }))
}

// Add custom logging methods for different contexts
logger.apiRequest = (req, res, responseTime) => {
  logger.info('API Request', {
    method: req.method,
    url: req.url,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  })
}

logger.security = (event, details) => {
  logger.warn('Security Event', {
    event,
    ...details,
    timestamp: new Date().toISOString()
  })
}

logger.database = (operation, details) => {
  logger.info('Database Operation', {
    operation,
    ...details,
    timestamp: new Date().toISOString()
  })
}

logger.auth = (action, userId, details = {}) => {
  logger.info('Authentication', {
    action,
    userId,
    ...details,
    timestamp: new Date().toISOString()
  })
}

module.exports = { logger }