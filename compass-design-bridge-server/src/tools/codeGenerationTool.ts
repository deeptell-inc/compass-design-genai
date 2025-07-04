import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AnthropicService } from '../services/anthropicService';
import { OpenAIService } from '../services/openaiService';
import { FigmaService } from '../services/figmaService';
import { databaseService } from '../services/databaseService';
import { CodeGenerationRequest } from '../types';

export class CodeGenerationTool {
  private anthropicService: AnthropicService;
  private openaiService: OpenAIService;
  private figmaService: FigmaService;

  constructor() {
    this.anthropicService = new AnthropicService();
    this.openaiService = new OpenAIService();
    this.figmaService = new FigmaService();
  }

  getToolDefinition(): Tool {
    return {
      name: 'generate_code',
      description: 'Generate code from Figma design or prompt using AI',
      inputSchema: {
        type: 'object',
        properties: {
          figmaFileKey: {
            type: 'string',
            description: 'Figma file key (optional if using prompt)',
          },
          figmaNodeId: {
            type: 'string',
            description: 'Specific Figma node ID to generate code for (optional if using prompt)',
          },
          prompt: {
            type: 'string',
            description: 'Text prompt for code generation (alternative to Figma)',
          },
          framework: {
            type: 'string',
            enum: ['react', 'vue', 'angular', 'html'],
            description: 'Target framework',
          },
          styling: {
            type: 'string',
            enum: ['tailwind', 'css', 'styled-components'],
            description: 'Styling approach',
          },
          options: {
            type: 'object',
            properties: {
              responsive: { type: 'boolean' },
              accessibility: { type: 'boolean' },
              typescript: { type: 'boolean' },
            },
          },
          aiProvider: {
            type: 'string',
            enum: ['anthropic', 'openai'],
            description: 'AI provider to use for code generation',
          },
        },
        required: ['framework', 'styling'],
      },
    };
  }

  async execute(args: any): Promise<any> {
    try {
      const { figmaFileKey, figmaNodeId, prompt, framework, styling, options = {}, aiProvider = 'openai' } = args;
      
      let figmaData = null;
      
      if (figmaFileKey) {
        try {
          const figmaFile = await this.figmaService.getFile(figmaFileKey);
          
          if (figmaNodeId && figmaNodeId !== 'root') {
            try {
              const figmaNodes = await this.figmaService.getFileNodes(figmaFileKey, [figmaNodeId]);
              figmaData = figmaNodes[figmaNodeId];
            } catch (error) {
              console.warn(`Failed to fetch specific node ${figmaNodeId}, using document root:`, error);
              figmaData = figmaFile.document;
            }
          } else {
            figmaData = figmaFile.document;
          }
        } catch (error) {
          console.warn('Failed to fetch Figma file, will use prompt-based generation:', error);
        }
      }

      const request: CodeGenerationRequest = {
        figmaNodeId: figmaNodeId || null,
        framework,
        styling,
        options: {
          responsive: options.responsive || false,
          accessibility: options.accessibility || true,
          typescript: options.typescript || false,
        },
      };

      let generatedCode: string;
      if (aiProvider === 'openai') {
        if (figmaData) {
          generatedCode = await this.openaiService.generateCodeWithGPT(request, figmaData);
        } else {
          generatedCode = await this.openaiService.generateCodeFromPrompt(prompt || 'Generate a modern component', framework, styling);
        }
      } else {
        if (figmaData) {
          generatedCode = await this.anthropicService.generateCode(request, figmaData);
        } else {
          generatedCode = await this.anthropicService.generateCodeFromPrompt(prompt || 'Generate a modern component', framework, styling);
        }
      }
      
      if (args.userId) {
        try {
          await databaseService.saveGeneratedArtifact(
            args.userId,
            figmaFileKey || null,
            figmaNodeId || null,
            `${framework}_code`,
            generatedCode,
            null,
            prompt || `Generate ${framework} code with ${styling} styling`
          );
          
          if (figmaFileKey) {
            await databaseService.saveFigmaFile(args.userId, figmaFileKey, null);
            await databaseService.updateFigmaFileImport(figmaFileKey);
          }
        } catch (dbError) {
          console.warn('Failed to save to database:', dbError);
        }
      }
      
      return {
        success: true,
        data: {
          code: generatedCode,
          framework,
          styling,
          options: request.options,
          aiProvider,
          usedFigmaData: !!figmaData,
          prompt: prompt || null,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate code: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
