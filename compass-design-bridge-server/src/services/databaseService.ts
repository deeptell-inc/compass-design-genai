import mysql from 'mysql2/promise';
import { config } from '../config';
import { fileStorageService } from './fileStorageService';

export class DatabaseService {
  private pool: mysql.Pool | null = null;
  private useFileStorage = false;

  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      this.pool = mysql.createPool({
        host: config.database.host,
        user: config.database.user,
        password: config.database.password,
        database: config.database.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // 接続テスト
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      console.log('MySQL database connected successfully');
    } catch (error) {
      console.warn('MySQL connection failed, falling back to file storage:', error instanceof Error ? error.message : 'Unknown error');
      this.useFileStorage = true;
      this.pool = null;
    }
  }

  async getConnection(): Promise<mysql.PoolConnection> {
    if (!this.pool) {
      throw new Error('Database not available');
    }
    return await this.pool.getConnection();
  }

  async query(text: string, params?: any[]): Promise<any> {
    if (this.useFileStorage) {
      throw new Error('Database query not available in file storage mode');
    }

    const connection = await this.getConnection();
    try {
      const [rows] = await connection.execute(text, params);
      return { rows };
    } finally {
      connection.release();
    }
  }

  async saveFigmaApiKey(userId: string, apiKey: string): Promise<void> {
    if (this.useFileStorage) {
      return fileStorageService.saveFigmaApiKey(userId, apiKey);
    }

    try {
      const encryptedKey = Buffer.from(apiKey).toString('base64');
      await this.query(
        `INSERT INTO user_figma_keys (user_id, encrypted_api_key) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE encrypted_api_key = ?, updated_at = NOW()`,
        [userId, encryptedKey, encryptedKey]
      );
    } catch (error) {
      console.warn('MySQL save failed, falling back to file storage:', error instanceof Error ? error.message : 'Unknown error');
      this.useFileStorage = true;
      return fileStorageService.saveFigmaApiKey(userId, apiKey);
    }
  }

  async getFigmaApiKey(userId: string): Promise<string | null> {
    if (this.useFileStorage) {
      return fileStorageService.getFigmaApiKey(userId);
    }

    try {
      const result = await this.query(
        'SELECT encrypted_api_key FROM user_figma_keys WHERE user_id = ?',
        [userId]
      );
      
      if (result.rows && result.rows.length > 0) {
        return Buffer.from(result.rows[0].encrypted_api_key, 'base64').toString();
      }
      return null;
    } catch (error) {
      console.warn('MySQL get failed, falling back to file storage:', error instanceof Error ? error.message : 'Unknown error');
      this.useFileStorage = true;
      return fileStorageService.getFigmaApiKey(userId);
    }
  }

  async getAllUsers(): Promise<any[]> {
    if (this.useFileStorage) {
      return fileStorageService.getAllUsers();
    }

    try {
      const result = await this.query(
        'SELECT user_id, email, created_at, updated_at FROM users ORDER BY created_at DESC'
      );
      return result.rows || [];
    } catch (error) {
      console.warn('MySQL get users failed, falling back to file storage:', error instanceof Error ? error.message : 'Unknown error');
      this.useFileStorage = true;
      return fileStorageService.getAllUsers();
    }
  }

  async createUser(email: string, passwordHash: string): Promise<string> {
    if (this.useFileStorage) {
      // ファイルストレージモードでは簡易UID生成
      return `file_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const result = await this.query(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      [email, passwordHash]
    );
    return result.insertId;
  }

  async getUserByEmail(email: string): Promise<any> {
    if (this.useFileStorage) {
      // ファイルストレージモードでは簡易認証（デモ用）
      return {
        user_id: `demo_user_${email.replace('@', '_').replace('.', '_')}`,
        email: email,
        password_hash: 'demo_hash' // デモ用
      };
    }

    const result = await this.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return result.rows[0];
  }

  async saveGeneratedArtifact(
    userId: string,
    figmaFileKey: string | null,
    figmaNodeId: string | null,
    artifactType: string,
    content: string | null,
    artifactUrl: string | null,
    promptText: string | null
  ): Promise<string> {
    const result = await this.query(
      `INSERT INTO generated_artifacts 
       (user_id, figma_file_key, figma_node_id, artifact_type, content, artifact_url, prompt_text) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, figmaFileKey, figmaNodeId, artifactType, content, artifactUrl, promptText]
    );
    return result.insertId;
  }

  async getGeneratedArtifacts(userId: string, limit: number = 50): Promise<any[]> {
    const result = await this.query(
      'SELECT * FROM generated_artifacts WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
    return result.rows;
  }

  async saveAISuggestion(
    userId: string,
    suggestionType: string,
    sourceContext: any,
    promptText: string | null,
    suggestionContent: string,
    llmModelUsed: string | null
  ): Promise<string> {
    const result = await this.query(
      `INSERT INTO ai_suggestions 
       (user_id, suggestion_type, source_context, prompt_text, suggestion_content, llm_model_used) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, suggestionType, JSON.stringify(sourceContext), promptText, suggestionContent, llmModelUsed]
    );
    return result.insertId;
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
    await this.query(
      `INSERT INTO user_events 
       (user_id, anonymous_id, session_id, event_type, url, element_selector, payload, event_timestamp) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, anonymousId, sessionId, eventType, url, elementSelector, JSON.stringify(payload), eventTimestamp]
    );
  }

  async saveFigmaFile(
    userId: string,
    figmaFileKey: string,
    name: string | null
  ): Promise<string> {
    const result = await this.query(
      `INSERT INTO figma_files (user_id, figma_file_key, name) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE name = ?, updated_at = NOW()`,
      [userId, figmaFileKey, name, name]
    );
    return result.insertId;
  }

  async updateFigmaFileImport(figmaFileKey: string): Promise<void> {
    await this.query(
      'UPDATE figma_files SET last_imported_at = NOW() WHERE figma_file_key = ?',
      [figmaFileKey]
    );
  }

  async saveABTestIdea(
    userId: string,
    name: string,
    description: string | null,
    hypothesis: string | null,
    targetMetric: string | null,
    controlDescription: string | null,
    variantDescription: string | null,
    relatedSuggestionId: string | null
  ): Promise<string> {
    const result = await this.query(
      `INSERT INTO ab_test_ideas 
       (user_id, name, description, hypothesis, target_metric, control_description, variant_description, related_suggestion_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, description, hypothesis, targetMetric, controlDescription, variantDescription, relatedSuggestionId]
    );
    return result.insertId;
  }

  async saveABTestResult(
    ideaId: string,
    variantName: string,
    metricName: string,
    metricValue: number | null,
    observationPeriodStart: Date | null,
    observationPeriodEnd: Date | null,
    notes: string | null
  ): Promise<string> {
    const result = await this.query(
      `INSERT INTO ab_test_results 
       (idea_id, variant_name, metric_name, metric_value, observation_period_start, observation_period_end, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ideaId, variantName, metricName, metricValue, observationPeriodStart, observationPeriodEnd, notes]
    );
    return result.insertId;
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

export const databaseService = new DatabaseService();
