import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

interface UserData {
  figmaApiKey?: string;
  [key: string]: any;
}

export class FileStorageService {
  private dataDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data', 'users');
    this.ensureDataDir();
  }

  private async ensureDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create data directory:', error);
    }
  }

  private getUserFilePath(userId: string): string {
    return path.join(this.dataDir, `${userId}.json`);
  }

  private encrypt(text: string): string {
    // 簡易暗号化（本番環境では適切な暗号化を使用）
    return Buffer.from(text).toString('base64');
  }

  private decrypt(encryptedText: string): string {
    // 簡易復号化
    return Buffer.from(encryptedText, 'base64').toString();
  }

  async saveFigmaApiKey(userId: string, apiKey: string): Promise<void> {
    try {
      const filePath = this.getUserFilePath(userId);
      let userData: UserData = {};

      // 既存データを読み込み
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        userData = JSON.parse(fileContent);
      } catch (error) {
        // ファイルが存在しない場合は新規作成
      }

      // APIキーを暗号化して保存
      userData.figmaApiKey = this.encrypt(apiKey);
      userData.updatedAt = new Date().toISOString();

      await fs.writeFile(filePath, JSON.stringify(userData, null, 2));
      console.log(`Figma API key saved for user: ${userId}`);
    } catch (error) {
      console.error('Failed to save Figma API key:', error);
      throw new Error('Failed to save Figma API key');
    }
  }

  async getFigmaApiKey(userId: string): Promise<string | null> {
    try {
      const filePath = this.getUserFilePath(userId);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const userData: UserData = JSON.parse(fileContent);

      if (userData.figmaApiKey) {
        return this.decrypt(userData.figmaApiKey);
      }
      return null;
    } catch (error) {
      // ファイルが存在しない場合
      return null;
    }
  }

  async getAllUsers(): Promise<any[]> {
    try {
      const files = await fs.readdir(this.dataDir);
      const users = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const userId = path.basename(file, '.json');
          const filePath = path.join(this.dataDir, file);
          
          try {
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const userData = JSON.parse(fileContent);
            users.push({
              user_id: userId,
              email: `user_${userId}@example.com`, // 仮のメール
              created_at: userData.createdAt || new Date().toISOString(),
              updated_at: userData.updatedAt || new Date().toISOString()
            });
          } catch (error) {
            console.error(`Failed to read user file ${file}:`, error);
          }
        }
      }

      return users;
    } catch (error) {
      console.error('Failed to get all users:', error);
      return [];
    }
  }
}

export const fileStorageService = new FileStorageService(); 