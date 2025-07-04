import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { databaseService } from './databaseService';

// 管理者メールアドレスのリスト
const ADMIN_EMAILS = ['info@deeptell.jp'];

export class AuthService {
  private isAdminEmail(email: string): boolean {
    return ADMIN_EMAILS.includes(email.toLowerCase());
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  generateToken(userId: string, email: string): string {
    const isAdmin = this.isAdminEmail(email);
    return jwt.sign(
      { 
        userId, 
        email,
        isAdmin // 管理者フラグを追加
      },
      config.jwtSecret,
      { expiresIn: '24h' }
    );
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async register(email: string, password: string) {
    try {
      // Check if user already exists
      const existingUser = await databaseService.getUserByEmail(email);
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const userId = await databaseService.createUser(email, hashedPassword);

      // Generate token with admin flag
      const token = this.generateToken(userId, email);
      const isAdmin = this.isAdminEmail(email);

      return {
        token,
        user: { 
          id: userId, 
          email,
          isAdmin 
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      // Get user by email
      const user = await databaseService.getUserByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Compare password
      const isValidPassword = await this.comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Generate token with admin flag
      const token = this.generateToken(user.user_id, user.email);
      const isAdmin = this.isAdminEmail(user.email);

      return {
        token,
        user: { 
          id: user.user_id, 
          email: user.email,
          isAdmin 
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

export const authService = new AuthService();
