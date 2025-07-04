import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { FigmaService } from '../services/figmaService';

export class FigmaTool {
  private figmaService: FigmaService;

  constructor() {
    this.figmaService = new FigmaService();
  }

  getToolDefinition(): Tool {
    return {
      name: 'fetch_figma_design',
      description: 'Fetch design data from Figma file',
      inputSchema: {
        type: 'object',
        properties: {
          fileKey: {
            type: 'string',
            description: 'Figma file key or URL',
          },
          nodeIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional specific node IDs to fetch',
          },
        },
        required: ['fileKey'],
      },
    };
  }

  async execute(args: any): Promise<any> {
    try {
      const { fileKey, nodeIds } = args;
      
      if (nodeIds && nodeIds.length > 0) {
        const nodes = await this.figmaService.getFileNodes(fileKey, nodeIds);
        return {
          success: true,
          data: nodes,
        };
      } else {
        const file = await this.figmaService.getFile(fileKey);
        const designTokens = this.figmaService.extractDesignTokens(file);
        
        return {
          success: true,
          data: {
            file,
            designTokens,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
