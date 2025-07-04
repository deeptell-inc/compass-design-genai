import dotenv from 'dotenv'

// Load test environment variables
dotenv.config({ path: '.env.test' })

// Set test environment
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key'
process.env.DB_HOST = 'localhost'
process.env.DB_PORT = '3306'
process.env.DB_NAME = 'compass_test_db'
process.env.DB_USER = 'test_user'
process.env.DB_PASSWORD = 'test_password'

// Mock console.log for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Global test timeout
jest.setTimeout(10000) 