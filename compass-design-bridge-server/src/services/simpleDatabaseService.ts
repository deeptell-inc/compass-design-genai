import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface User {
  user_id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export class SimpleDatabaseService {
  private dataDir: string;
  private usersFile: string;

  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    this.usersFile = path.join(this.dataDir, 'users.json');
    this.ensureDataDir();
  }

  private ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.usersFile)) {
      fs.writeFileSync(this.usersFile, JSON.stringify([], null, 2));
    }
  }

  private loadUsers(): User[] {
    try {
      const data = fs.readFileSync(this.usersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  private saveUsers(users: User[]) {
    fs.writeFileSync(this.usersFile, JSON.stringify(users, null, 2));
  }

  async createUser(email: string, passwordHash: string): Promise<string> {
    const users = this.loadUsers();
    const userId = crypto.randomUUID();
    
    const newUser: User = {
      user_id: userId,
      email,
      password_hash: passwordHash,
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    this.saveUsers(users);
    
    return userId;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const users = this.loadUsers();
    return users.find(user => user.email === email) || null;
  }

  async saveUserEvent(
    userId: string | null,
    anonymousId: string | null,
    sessionId: string | null,
    eventType: string,
    url: string | null,
    elementSelector: string | null,
    payload: any,
    eventTimestamp: Date
  ): Promise<void> {
    // For now, just log the event
    console.log('Event tracked:', { userId, eventType, url });
  }
}

export const simpleDatabaseService = new SimpleDatabaseService();