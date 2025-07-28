const mysql = require('mysql2/promise')
const { logger } = require('../utils/logger')

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'productivity_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4'
}

// Create connection pool
const pool = mysql.createPool(dbConfig)

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection()
    logger.info('Database connected successfully')
    connection.release()
    return true
  } catch (error) {
    logger.error('Database connection failed:', error)
    return false
  }
}

// Initialize database (create tables if they don't exist)
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection()

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Create tasks table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
        due_date DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create OKRs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS okrs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        period VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status ENUM('draft', 'active', 'completed', 'archived') DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create key_results table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS key_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        okr_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        target_value DECIMAL(10,2) NOT NULL,
        current_value DECIMAL(10,2) DEFAULT 0,
        unit VARCHAR(20),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (okr_id) REFERENCES okrs(id) ON DELETE CASCADE
      )
    `)

    // Create clients table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        company VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `)

    // Create invoices table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        client_id INT NOT NULL,
        invoice_number VARCHAR(50) NOT NULL,
        issue_date DATE NOT NULL,
        due_date DATE NOT NULL,
        currency ENUM('USD', 'EUR', 'GBP', 'CAD', 'AUD') DEFAULT 'USD',
        subtotal DECIMAL(10,2) NOT NULL,
        tax_rate DECIMAL(5,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) NOT NULL,
        notes TEXT,
        status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        UNIQUE KEY unique_invoice_number_user (user_id, invoice_number)
      )
    `)

    // Create invoice_items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        description VARCHAR(200) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
      )
    `)

    // Create indexes for better performance
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status)')
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)')
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_okrs_user_status ON okrs(user_id, status)')
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON invoices(user_id, status)')
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_clients_user_email ON clients(user_id, email)')

    connection.release()
    logger.info('Database initialized successfully')
  } catch (error) {
    logger.error('Database initialization failed:', error)
    throw error
  }
}

// Graceful shutdown
const closeDatabase = async () => {
  try {
    await pool.end()
    logger.info('Database connection pool closed')
  } catch (error) {
    logger.error('Error closing database:', error)
  }
}

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
  closeDatabase
}