import { AuthService } from './authService'

// Mock bcrypt
const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn(),
}

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}))

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    authService = new AuthService()
  })

  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123'
      const hashedPassword = 'hashedPassword123'
      
      const bcrypt = require('bcryptjs')
      bcrypt.hash.mockResolvedValue(hashedPassword)
      
      const result = await authService.hashPassword(password)
      
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10)
      expect(result).toBe(hashedPassword)
    })
  })

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testPassword123'
      const hashedPassword = 'hashedPassword123'
      
      const bcrypt = require('bcryptjs')
      bcrypt.compare.mockResolvedValue(true)
      
      const result = await authService.comparePassword(password, hashedPassword)
      
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword)
      expect(result).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const password = 'wrongPassword'
      const hashedPassword = 'hashedPassword123'
      
      const bcrypt = require('bcryptjs')
      bcrypt.compare.mockResolvedValue(false)
      
      const result = await authService.comparePassword(password, hashedPassword)
      
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword)
      expect(result).toBe(false)
    })
  })

  describe('generateToken', () => {
    it('should generate JWT token', () => {
      const userId = 'user123'
      const email = 'test@example.com'
      const token = authService.generateToken(userId, email)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
    })
  })
})