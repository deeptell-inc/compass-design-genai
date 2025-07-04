import axios from 'axios';
import { config } from '../config';
import { FigmaFile, FigmaNode, DesignToken } from '../types';

export class FigmaService {
  private baseUrl = 'https://api.figma.com/v1';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || config.figmaApiKey || config.figmaAccessToken;
  }
  
  async getFile(fileKey: string): Promise<FigmaFile> {
    // Return mock data if no valid API key is provided
    if (!this.apiKey || this.apiKey === 'demo-figma-key') {
      console.log('Using mock Figma data for file:', fileKey);
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

    try {
      const response = await axios.get(`${this.baseUrl}/files/${fileKey}`, {
        headers: {
          'X-Figma-Token': this.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch Figma file: ${error}`);
    }
  }

  async getFileNodes(fileKey: string, nodeIds: string[]): Promise<Record<string, FigmaNode>> {
    // Return mock data if no valid API key is provided
    if (!this.apiKey || this.apiKey === 'demo-figma-key') {
      console.log('Using mock Figma node data for:', nodeIds);
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

    try {
      const response = await axios.get(`${this.baseUrl}/files/${fileKey}/nodes`, {
        params: { ids: nodeIds.join(',') },
        headers: {
          'X-Figma-Token': this.apiKey,
        },
      });
      return response.data.nodes;
    } catch (error) {
      throw new Error(`Failed to fetch Figma nodes: ${error}`);
    }
  }

  extractDesignTokens(figmaFile: FigmaFile): DesignToken[] {
    const tokens: DesignToken[] = [];
    
    const extractFromNode = (node: FigmaNode) => {
      if (node.fills) {
        node.fills.forEach((fill, index) => {
          if (fill.type === 'SOLID') {
            tokens.push({
              name: `${node.name}-fill-${index}`,
              value: this.rgbToHex(fill.color),
              type: 'color',
              category: 'fills',
            });
          }
        });
      }

      if (node.strokes) {
        node.strokes.forEach((stroke, index) => {
          if (stroke.type === 'SOLID') {
            tokens.push({
              name: `${node.name}-stroke-${index}`,
              value: this.rgbToHex(stroke.color),
              type: 'color',
              category: 'strokes',
            });
          }
        });
      }

      if (node.children) {
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

  async importImageToFigma(imageUrl: string, description: string): Promise<string> {
    try {
      return `https://www.figma.com/file/mock-file-id/generated-design-${Date.now()}`;
    } catch (error) {
      throw new Error(`Failed to import image to Figma: ${error}`);
    }
  }
}
