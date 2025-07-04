import axios, { AxiosError } from 'axios';
import { config } from '../config';
import { FigmaFile, FigmaNode, DesignToken } from '../types';

interface FigmaApiError {
  err: string;
  status?: number;
}

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
}

export class FigmaService {
  private baseUrl = 'https://api.figma.com/v1';
  private apiKey: string;
  private retryOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FIGMA_ACCESS_TOKEN || '';
    
    // APIキーの検証
    if (!this.apiKey || this.apiKey === 'demo-figma-key' || this.apiKey === 'your-figma-access-token') {
      console.warn('⚠️  Invalid or missing Figma API key. Using mock data.');
    }
  }

  /**
   * ファイルキーの正規化（URLから抽出）
   */
  private normalizeFileKey(fileKey: string): string {
    // URL形式の場合は file_key を抽出
    const match = fileKey.match(/\/design\/([a-zA-Z0-9]{22})/);
    if (match) {
      return match[1];
    }
    
    // 既にfile_keyの場合はそのまま使用
    if (/^[a-zA-Z0-9]{22}$/.test(fileKey)) {
      return fileKey;
    }
    
    throw new Error(`Invalid Figma file key format: ${fileKey}`);
  }

  /**
   * レート制限に対応したリトライ機能付きリクエスト
   */
  private async makeRequest<T>(
    url: string, 
    options: { params?: Record<string, any> } = {}
  ): Promise<T> {
    const { maxRetries = 3, baseDelay = 1000 } = this.retryOptions;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`, // ★ 公式推奨の認証ヘッダー
            'Content-Type': 'application/json',
          },
        });

        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<FigmaApiError>;
        
        if (axiosError.response) {
          const { status, data } = axiosError.response;
          
          // 429: Rate limit - Retry-After ヘッダーを確認
          if (status === 429) {
            const retryAfter = axiosError.response.headers['retry-after'];
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, attempt);
            
            if (attempt < maxRetries) {
              console.log(`Rate limited. Retrying after ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
              await this.sleep(waitTime);
              continue;
            }
            throw new Error(`Rate limit exceeded. Retry after ${retryAfter || 'unknown'} seconds`);
          }
          
          // 403: Forbidden - 認証・権限エラー
          if (status === 403) {
            throw new Error(`Figma API access denied: ${data?.err || 'Check your API key and file permissions'}`);
          }
          
          // 404: Not found - ファイルが存在しないか権限なし
          if (status === 404) {
            throw new Error(`Figma file not found: ${data?.err || 'File may not exist or you may not have access'}`);
          }
          
          // 504: Gateway timeout - ファイルサイズが大きい場合
          if (status === 504) {
            throw new Error(`Figma API timeout: File too large. Try using depth parameter or request specific nodes`);
          }
          
          // その他のエラー
          throw new Error(`Figma API error ${status}: ${data?.err || axiosError.message}`);
        }
        
        // ネットワークエラー等
        if (attempt < maxRetries) {
          const waitTime = baseDelay * Math.pow(2, attempt);
          console.log(`Network error. Retrying after ${waitTime}ms (attempt ${attempt + 1}/${maxRetries})`);
          await this.sleep(waitTime);
          continue;
        }
        
        throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Figmaファイルを取得（depthパラメータ対応）
   */
  async getFile(fileKey: string, depth: number = 1): Promise<FigmaFile> {
    // APIキーが無効な場合はモックデータを返す
    if (!this.apiKey || this.apiKey === 'demo-figma-key' || this.apiKey === 'your-figma-access-token') {
      console.log('Using mock Figma data for file:', fileKey);
      return this.getMockFile(fileKey);
    }

    try {
      const normalizedKey = this.normalizeFileKey(fileKey);
      
      const data = await this.makeRequest<{ name: string; lastModified: string; thumbnailUrl: string; version: string; document: FigmaNode }>(
        `${this.baseUrl}/files/${normalizedKey}`,
        { params: { depth } }
      );

      return {
        name: data.name,
        lastModified: data.lastModified,
        thumbnailUrl: data.thumbnailUrl,
        version: data.version,
        document: data.document
      };
    } catch (error) {
      console.error('Figma API error:', error);
      throw error;
    }
  }

  /**
   * 特定のノードを取得
   */
  async getFileNodes(fileKey: string, nodeIds: string[]): Promise<Record<string, FigmaNode>> {
    // APIキーが無効な場合はモックデータを返す
    if (!this.apiKey || this.apiKey === 'demo-figma-key' || this.apiKey === 'your-figma-access-token') {
      console.log('Using mock Figma node data for:', nodeIds);
      return this.getMockNodes(nodeIds);
    }

    try {
      const normalizedKey = this.normalizeFileKey(fileKey);
      
      const data = await this.makeRequest<{ nodes: Record<string, FigmaNode> }>(
        `${this.baseUrl}/files/${normalizedKey}/nodes`,
        { params: { ids: nodeIds.join(',') } }
      );

      return data.nodes;
    } catch (error) {
      console.error('Figma nodes API error:', error);
      throw error;
    }
  }

  /**
   * デザイントークンの抽出（null安全性向上）
   */
  extractDesignTokens(figmaFile: FigmaFile): DesignToken[] {
    const tokens: DesignToken[] = [];
    
    const extractFromNode = (node: FigmaNode) => {
      if (!node) return;
      
      // カラーフィルの抽出
      if (node.fills && Array.isArray(node.fills)) {
        node.fills.forEach((fill, index) => {
          if (fill?.type === 'SOLID' && fill.color) {
            tokens.push({
              name: `${node.name || 'unnamed'}-fill-${index}`,
              value: this.rgbToHex(fill.color),
              type: 'color',
              category: 'fills',
            });
          }
        });
      }

      // ストロークの抽出
      if (node.strokes && Array.isArray(node.strokes)) {
        node.strokes.forEach((stroke, index) => {
          if (stroke?.type === 'SOLID' && stroke.color) {
            tokens.push({
              name: `${node.name || 'unnamed'}-stroke-${index}`,
              value: this.rgbToHex(stroke.color),
              type: 'color',
              category: 'strokes',
            });
          }
        });
      }

      // テキストスタイルの抽出
      if (node.type === 'TEXT' && node.style) {
        const style = node.style;
        if (style.fontFamily) {
          tokens.push({
            name: `${node.name || 'unnamed'}-font-family`,
            value: style.fontFamily,
            type: 'typography',
            category: 'font-family',
          });
        }
        if (style.fontSize) {
          tokens.push({
            name: `${node.name || 'unnamed'}-font-size`,
            value: `${style.fontSize}px`,
            type: 'typography',
            category: 'font-size',
          });
        }
      }

      // 子ノードの処理
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(extractFromNode);
      }
    };

    extractFromNode(figmaFile.document);
    return tokens;
  }

  private rgbToHex(rgb: { r: number; g: number; b: number }): string {
    const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }

  /**
   * モックファイルの生成
   */
  private getMockFile(fileKey: string): FigmaFile {
    return {
      name: `Mock Figma File ${fileKey.slice(0, 8)}`,
      lastModified: new Date().toISOString(),
      thumbnailUrl: 'https://via.placeholder.com/400x300',
      version: '1.0',
      document: {
        id: 'mock-root',
        name: 'Mock Document',
        type: 'DOCUMENT',
        children: [
          {
            id: 'mock-page',
            name: 'Mock Page',
            type: 'CANVAS',
            children: [
              {
                id: 'mock-frame',
                name: 'Mock Frame',
                type: 'FRAME',
                absoluteBoundingBox: { x: 0, y: 0, width: 375, height: 812 },
                fills: [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.98, a: 1 } }],
                children: [
                  {
                    id: 'mock-text',
                    name: 'Mock Text',
                    type: 'TEXT',
                    characters: 'Sample Design Text',
                    style: {
                      fontFamily: 'Inter',
                      fontSize: 16,
                      fontWeight: 400,
                      textAlignHorizontal: 'LEFT'
                    },
                    fills: [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1, a: 1 } }]
                  }
                ]
              }
            ]
          }
        ]
      }
    };
  }

  /**
   * モックノードの生成
   */
  private getMockNodes(nodeIds: string[]): Record<string, FigmaNode> {
    const mockNodes: Record<string, FigmaNode> = {};
    nodeIds.forEach((nodeId, index) => {
      mockNodes[nodeId] = {
        id: nodeId,
        name: `Mock Node ${index + 1}`,
        type: 'FRAME',
        absoluteBoundingBox: { x: index * 100, y: index * 100, width: 200, height: 150 },
        fills: [{ type: 'SOLID', color: { r: 0.8, g: 0.9, b: 1.0, a: 1 } }]
      };
    });
    return mockNodes;
  }

  /**
   * APIキーの検証
   */
  async validateApiKey(): Promise<boolean> {
    try {
      // 存在する公開ファイルで検証（Community fileを使用）
      await this.makeRequest(`${this.baseUrl}/files/community_file_id`);
      return true;
    } catch (error) {
      return false;
    }
  }

  async importImageToFigma(imageUrl: string, description: string): Promise<string> {
    try {
      return `https://www.figma.com/file/mock-file-id/generated-design-${Date.now()}`;
    } catch (error) {
      throw new Error(`Failed to import image to Figma: ${error}`);
    }
  }
}
